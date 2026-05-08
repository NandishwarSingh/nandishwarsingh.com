import type { NextRequest } from "next/server"
import { z } from "zod"
import { qrClicks, qrLinks } from "@/lib/db"
import { QrStyleSchema } from "@/lib/qr-style"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SITE_ORIGIN = process.env.SITE_ORIGIN ?? "http://localhost:3000"

type Params = { slug: string }

const SLUG_RE = /^[A-Za-z0-9]{6,12}$/

const PatchBody = z.object({
  targetUrl: z.string().url().optional(),
  title: z.string().trim().min(1).max(120).optional(),
  style: QrStyleSchema.optional(),
  archived: z.boolean().optional(),
})

function ownerKeyFrom(req: NextRequest): string | null {
  return (
    req.headers.get("x-owner-key") ??
    req.nextUrl.searchParams.get("ownerKey") ??
    null
  )
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { slug } = await ctx.params
  if (!SLUG_RE.test(slug)) {
    return Response.json({ error: "Invalid slug" }, { status: 400 })
  }

  const links = await qrLinks()
  const link = await links.findOne({ slug })
  if (!link || link.archived) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  // Owner key check decides whether we expose mutation rights to the client.
  const isOwner = link.ownerKey === ownerKeyFrom(request)

  const clicks = await qrClicks()
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalCount,
    uniqueCount,
    timeseries,
    countries,
    devices,
    browsers,
    recent,
  ] = await Promise.all([
    clicks.countDocuments({ slug }),
    clicks.distinct("ipHash", { slug }).then((arr) => arr.length),
    clicks
      .aggregate([
        { $match: { slug, ts: { $gte: since30d } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$ts" },
            },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, day: "$_id", clicks: 1 } },
      ])
      .toArray(),
    clicks
      .aggregate([
        { $match: { slug } },
        {
          $group: {
            _id: { $ifNull: ["$country", "—"] },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 12 },
        { $project: { _id: 0, country: "$_id", clicks: 1 } },
      ])
      .toArray(),
    clicks
      .aggregate([
        { $match: { slug } },
        {
          $group: {
            _id: { $ifNull: ["$device", "Other"] },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        { $project: { _id: 0, device: "$_id", clicks: 1 } },
      ])
      .toArray(),
    clicks
      .aggregate([
        { $match: { slug } },
        {
          $group: {
            _id: { $ifNull: ["$browser", "Other"] },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, browser: "$_id", clicks: 1 } },
      ])
      .toArray(),
    clicks
      .find(
        { slug },
        { projection: { _id: 0, ip: 0, ipHash: 0, referrer: 0 } }
      )
      .sort({ ts: -1 })
      .limit(50)
      .toArray(),
  ])

  return Response.json({
    link: {
      slug: link.slug,
      title: link.title,
      targetUrl: link.targetUrl,
      shortUrl: `${SITE_ORIGIN}/r/${link.slug}`,
      style: link.style,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    },
    isOwner,
    stats: {
      totalCount,
      uniqueCount,
      timeseries,
      countries,
      devices,
      browsers,
      recent,
    },
  })
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { slug } = await ctx.params
  if (!SLUG_RE.test(slug)) {
    return Response.json({ error: "Invalid slug" }, { status: 400 })
  }
  const ownerKey = ownerKeyFrom(request)
  if (!ownerKey) {
    return Response.json({ error: "Owner key required" }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = PatchBody.safeParse(payload)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }

  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (parsed.data.targetUrl) update.targetUrl = parsed.data.targetUrl
  if (parsed.data.title) update.title = parsed.data.title
  if (parsed.data.style) update.style = parsed.data.style
  if (typeof parsed.data.archived === "boolean")
    update.archived = parsed.data.archived

  const links = await qrLinks()
  const res = await links.findOneAndUpdate(
    { slug, ownerKey },
    { $set: update },
    { returnDocument: "after" }
  )
  if (!res) {
    return Response.json(
      { error: "Not found or wrong owner key" },
      { status: 404 }
    )
  }
  return Response.json({ ok: true })
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { slug } = await ctx.params
  if (!SLUG_RE.test(slug)) {
    return Response.json({ error: "Invalid slug" }, { status: 400 })
  }
  const ownerKey = ownerKeyFrom(request)
  if (!ownerKey) {
    return Response.json({ error: "Owner key required" }, { status: 401 })
  }

  const links = await qrLinks()
  const res = await links.findOneAndUpdate(
    { slug, ownerKey },
    { $set: { archived: true, updatedAt: new Date() } }
  )
  if (!res) {
    return Response.json(
      { error: "Not found or wrong owner key" },
      { status: 404 }
    )
  }
  return Response.json({ ok: true })
}
