import { createHash, randomUUID } from "node:crypto"
import { z } from "zod"
import { UAParser } from "ua-parser-js"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import {
  ensureIndexes,
  pageViews,
  sessions,
  type PageView,
  type Session,
} from "@/lib/db"
import { combinedBotCheck } from "@/lib/bot-filter"
import { lookupGeo } from "@/lib/geoip"
import { isTrackedPath, normalizePath } from "@/lib/track-path"
import { clientIp } from "@/lib/ratelimit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SESSION_COOKIE = "nandi_sid"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365 // a year — sliding refresh on every event
const HEARTBEAT_CAP_MS = 90_000 // a single heartbeat can never extend a view by > 90s
const VIEW_HARD_CAP_MS = 60 * 60 * 1000 // a single page can never count as > 1h
/**
 * Dedup window for view inserts. The same (sessionId, path) within this window
 * collapses into the original pageview row — refreshes / quick re-visits don't
 * inflate counts. Heartbeats + leaves still extend that original row's duration.
 */
const VIEW_DEDUP_WINDOW_MS = 12 * 60 * 60 * 1000

const SignalsSchema = z
  .object({
    webdriver: z.boolean().optional(),
    cookiesEnabled: z.boolean().optional(),
    languages: z.number().int().min(0).max(20).optional(),
    hardwareConcurrency: z.number().int().min(0).max(256).optional(),
    screenWidth: z.number().int().min(0).max(20000).optional(),
    flagged: z.string().max(60).optional(),
  })
  .optional()

const Body = z.object({
  event: z.enum(["view", "heartbeat", "leave"]),
  path: z.string().min(1).max(512),
  referrer: z.string().max(2048).optional(),
  durationMs: z.number().int().min(0).max(VIEW_HARD_CAP_MS).optional(),
  signals: SignalsSchema,
})

async function getOrSetSessionId(): Promise<string> {
  const jar = await cookies()
  const existing = jar.get(SESSION_COOKIE)?.value
  if (existing && /^[a-f0-9-]{16,64}$/i.test(existing)) {
    return existing
  }
  const fresh = randomUUID()
  jar.set({
    name: SESSION_COOKIE,
    value: fresh,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  })
  return fresh
}

export async function POST(request: NextRequest) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = Body.safeParse(payload)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }

  const { event, signals } = parsed.data
  const path = normalizePath(parsed.data.path)
  if (!isTrackedPath(path)) {
    return Response.json({ ok: true, ignored: "not-tracked" })
  }

  const ua = request.headers.get("user-agent")
  const bot = combinedBotCheck({
    ua,
    headers: request.headers,
    signals,
  })
  // Bots are silently accepted (return 200) but never recorded as humans.
  // We still keep the row so admin can see what was filtered, with isBot=true.

  const ip = clientIp(request)
  const ipHash = createHash("sha256")
    .update(ip + "|nandi")
    .digest("hex")
    .slice(0, 24)

  await ensureIndexes()
  const sessionId = await getOrSetSessionId()
  const pv = await pageViews()
  const ss = await sessions()
  const now = new Date()

  if (event === "view") {
    const parser = new UAParser(ua ?? "")
    const browser = parser.getBrowser().name
    const os = parser.getOS().name
    const detectedDevice = parser.getDevice().type
    const device =
      detectedDevice ??
      (os && /android|ios/i.test(os) ? "mobile" : "desktop")
    const geo = lookupGeo(ip)
    const referrer = parsed.data.referrer || request.headers.get("referer") || undefined

    // Has this session already hit this path within the dedup window?
    const dedupCutoff = new Date(now.getTime() - VIEW_DEDUP_WINDOW_MS)
    const recent = await pv.findOne(
      { sessionId, path, ts: { $gte: dedupCutoff } },
      { projection: { _id: 1 }, sort: { ts: -1 } }
    )
    const inserted = !recent

    if (inserted) {
      const doc: PageView = {
        sessionId,
        path,
        ts: now,
        durationMs: 0,
        ip,
        ipHash,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        ua: ua ?? "",
        device,
        os,
        browser,
        referrer,
        isBot: bot.isBot,
        botReason: bot.reason,
        isUnique: true,
      }
      await pv.insertOne(doc)
    }

    // Session always gets bumped (lastSeenAt + identity refresh) so an active
    // visitor refreshing the same page still counts as "active now". pageCount
    // only grows when we actually inserted a pageview (a fresh, non-deduped view).
    const sessionDoc: Partial<Session> = {
      lastSeenAt: now,
      lastPath: path,
      country: geo.country,
      ua: ua ?? "",
      device,
      os,
      browser,
      isBot: bot.isBot,
    }
    const ssExisting = await ss.findOne(
      { sessionId },
      { projection: { _id: 1, lastPath: 1, pageCount: 1 } }
    )
    if (!ssExisting) {
      await ss.insertOne({
        sessionId,
        startedAt: now,
        lastSeenAt: now,
        pageCount: 1,
        totalDurationMs: 0,
        ip,
        ipHash,
        country: geo.country,
        ua: ua ?? "",
        device,
        os,
        browser,
        isBot: bot.isBot,
        firstPath: path,
        lastPath: path,
        referrer,
      })
    } else {
      await ss.updateOne(
        { sessionId },
        { $set: sessionDoc, $inc: { pageCount: inserted ? 1 : 0 } }
      )
    }

    return Response.json({ ok: true, sessionId, isBot: bot.isBot, deduped: !inserted })
  }

  if (event === "heartbeat" || event === "leave") {
    const incoming = parsed.data.durationMs ?? 0
    const delta = event === "heartbeat"
      ? Math.min(incoming, HEARTBEAT_CAP_MS)
      : Math.min(incoming, VIEW_HARD_CAP_MS)
    if (delta <= 0) {
      return Response.json({ ok: true, noop: true })
    }
    // Latest pageview row for this (session, path) is the active one.
    const target = await pv.findOne(
      { sessionId, path },
      { projection: { _id: 1, durationMs: 1 }, sort: { ts: -1 } }
    )
    if (target) {
      const nextDur = Math.min(
        VIEW_HARD_CAP_MS,
        (target.durationMs ?? 0) + delta
      )
      await pv.updateOne(
        { _id: target._id },
        {
          $set: {
            durationMs: nextDur,
            ...(event === "leave" ? { endedAt: now } : {}),
          },
        }
      )
    }
    await ss.updateOne(
      { sessionId },
      {
        $set: { lastSeenAt: now },
        $inc: { totalDurationMs: delta },
      }
    )
    return Response.json({ ok: true })
  }

  return Response.json({ ok: true })
}

export async function GET() {
  return Response.json({ ok: true, endpoint: "track" })
}
