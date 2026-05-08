import type { NextRequest } from "next/server"
import { ensureIndexes, posts } from "@/lib/db"
import { PostPatchSchema, SLUG_RE } from "@/lib/posts"
import { pingIndexNow } from "@/lib/indexnow"
import { SITE } from "@/lib/site"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Params = { slug: string }

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { slug } = await ctx.params
  if (!SLUG_RE.test(slug)) {
    return Response.json({ error: "Invalid slug" }, { status: 400 })
  }
  const ps = await posts()
  const doc = await ps.findOne({ slug })
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json({ post: doc })
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { slug } = await ctx.params
  if (!SLUG_RE.test(slug)) {
    return Response.json({ error: "Invalid slug" }, { status: 400 })
  }
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = PostPatchSchema.safeParse(payload)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const path = issue?.path?.join(".") ?? "(root)"
    return Response.json(
      {
        error: `${path}: ${issue?.message ?? "Invalid input"}`,
        issues: parsed.error.issues,
      },
      { status: 400 }
    )
  }
  const data = parsed.data
  await ensureIndexes()
  const ps = await posts()

  const existing = await ps.findOne({ slug })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (data.title !== undefined) update.title = data.title
  if (data.summary !== undefined) update.summary = data.summary
  if (data.body !== undefined) update.body = data.body
  if (data.coverImage !== undefined)
    update.coverImage = data.coverImage || undefined
  if (data.tags !== undefined) update.tags = data.tags
  if (data.seo !== undefined) update.seo = { ...existing.seo, ...data.seo }
  if (data.status !== undefined) {
    update.status = data.status
    if (data.status === "published" && !existing.publishedAt) {
      update.publishedAt = new Date()
    }
  }

  // Slug rename — make sure target is free.
  if (data.slug && data.slug !== slug) {
    const clash = await ps.findOne(
      { slug: data.slug },
      { projection: { _id: 1 } }
    )
    if (clash) {
      return Response.json({ error: "Slug already taken" }, { status: 409 })
    }
    update.slug = data.slug
  }

  await ps.updateOne({ slug }, { $set: update })
  const finalSlug = (update.slug as string) ?? slug
  const wasPublished = existing.status === "published"
  const willBePublished =
    data.status === "published" || (data.status === undefined && wasPublished)
  if (willBePublished) {
    void pingIndexNow([
      `${SITE.origin}/blog/${finalSlug}`,
      `${SITE.origin}/blog`,
      `${SITE.origin}/sitemap.xml`,
    ]).catch(() => {})
  }
  return Response.json({ ok: true, slug: finalSlug })
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { slug } = await ctx.params
  if (!SLUG_RE.test(slug)) {
    return Response.json({ error: "Invalid slug" }, { status: 400 })
  }
  const ps = await posts()
  const res = await ps.deleteOne({ slug })
  if (res.deletedCount === 0) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
  return Response.json({ ok: true })
}
