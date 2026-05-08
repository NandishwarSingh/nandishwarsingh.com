import type { NextRequest } from "next/server"
import { createHash } from "node:crypto"
import { UAParser } from "ua-parser-js"
import { qrClicks, qrLinks, type QrClick } from "@/lib/db"
import { lookupGeo } from "@/lib/geoip"
import { clientIp } from "@/lib/ratelimit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Params = { slug: string }

const SLUG_RE = /^[A-Za-z0-9]{6,12}$/

function notFoundHtml(): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Link not found</title>
<style>body{font-family:system-ui;background:#0a0a0a;color:#ededed;display:grid;place-items:center;min-height:100vh;margin:0}main{text-align:center}a{color:#cadcfc}</style>
<main><h1>Link not found</h1><p>This short link doesn't exist or was deleted.</p><a href="/tools/qr">Create your own →</a></main>`,
    {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  )
}

async function recordClick(
  slug: string,
  request: NextRequest
): Promise<void> {
  try {
    const ip = clientIp(request)
    const ua = request.headers.get("user-agent") ?? ""
    const referrer = request.headers.get("referer") ?? ""
    const geo = lookupGeo(ip)
    const parser = new UAParser(ua)
    const ipHash = createHash("sha256")
      .update(ip + ":" + slug)
      .digest("hex")
      .slice(0, 24)

    const clicks = await qrClicks()
    const recent = await clicks.findOne(
      { slug, ipHash },
      { projection: { _id: 1 } }
    )

    const browser = parser.getBrowser().name
    const os = parser.getOS().name
    const device =
      parser.getDevice().type ??
      (os && /android|ios/i.test(os) ? "mobile" : "desktop")

    const doc: QrClick = {
      slug,
      ts: new Date(),
      ip,
      ipHash,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      ua,
      device,
      os,
      browser,
      referrer: referrer || undefined,
      isUnique: !recent,
    }
    await clicks.insertOne(doc)
  } catch (err) {
    console.error("[qr-click-record]", err)
  }
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { slug } = await ctx.params
  if (!SLUG_RE.test(slug)) return notFoundHtml()

  const links = await qrLinks()
  const link = await links.findOne(
    { slug, archived: false },
    { projection: { targetUrl: 1, slug: 1 } }
  )
  if (!link) return notFoundHtml()

  // Fire-and-forget click record so the redirect isn't blocked on Mongo write.
  void recordClick(slug, request)

  return Response.redirect(link.targetUrl, 302)
}
