import type { NextRequest } from "next/server"
import { z } from "zod"
import {
  ensureIndexes,
  qrLinks,
  type QrLink,
} from "@/lib/db"
import { generateOwnerKey, generateSlug } from "@/lib/slug"
import { QrStyleSchema } from "@/lib/qr-style"
import { clientIp, rateLimit } from "@/lib/ratelimit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SITE_ORIGIN = process.env.SITE_ORIGIN ?? "http://localhost:3000"

const CreateBody = z.object({
  targetUrl: z
    .string()
    .url()
    .max(2048, "URL too long for a QR code (max 2048 chars)")
    .refine(
      (u) => /^https?:\/\//i.test(u),
      "URL must start with http:// or https://"
    ),
  title: z.string().trim().min(1).max(120).default("Untitled QR"),
  style: QrStyleSchema.optional(),
})

export async function POST(request: NextRequest) {
  const ip = clientIp(request)
  const rl = await rateLimit("qr-create", ip, 100, 60 * 60 * 1000)
  if (!rl.ok) {
    return Response.json(
      {
        error: "Rate limit exceeded. Try again later.",
        resetAt: rl.resetAt.toISOString(),
      },
      { status: 429 }
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = CreateBody.safeParse(payload)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }

  const { targetUrl, title } = parsed.data
  const style = parsed.data.style ?? QrStyleSchema.parse({})

  await ensureIndexes()
  const links = await qrLinks()
  const ownerKey = generateOwnerKey()
  const now = new Date()

  // Try a few slugs in case of unlikely collision.
  let slug = ""
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = generateSlug(7 + Math.floor(attempt / 2))
    try {
      const doc: QrLink = {
        slug: candidate,
        targetUrl,
        title,
        style: style as Record<string, unknown>,
        ownerKey,
        createdAt: now,
        updatedAt: now,
        archived: false,
      }
      await links.insertOne(doc)
      slug = candidate
      break
    } catch (err) {
      const isDup =
        err && typeof err === "object" && "code" in err && err.code === 11000
      if (!isDup) throw err
    }
  }
  if (!slug) {
    return Response.json(
      { error: "Could not allocate a slug — try again" },
      { status: 503 }
    )
  }

  return Response.json({
    slug,
    shortUrl: `${SITE_ORIGIN}/r/${slug}`,
    ownerKey,
  })
}

export async function GET() {
  return Response.json({ ok: true, endpoint: "qr" })
}
