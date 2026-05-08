import type { NextRequest } from "next/server"
import { ensureIndexes, posts, type Post } from "@/lib/db"
import {
  PostCreateSchema,
  SLUG_RE,
  slugify,
} from "@/lib/posts"
import { pingIndexNow } from "@/lib/indexnow"
import { SITE } from "@/lib/site"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  await ensureIndexes()
  const ps = await posts()
  const status = request.nextUrl.searchParams.get("status") ?? undefined
  const filter: Record<string, unknown> = {}
  if (status === "draft" || status === "published") filter.status = status
  const list = await ps
    .find(filter, {
      projection: { body: 0 },
    })
    .sort({ updatedAt: -1 })
    .limit(200)
    .toArray()
  return Response.json({ posts: list })
}

export async function POST(request: NextRequest) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = PostCreateSchema.safeParse(payload)
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

  let slug = data.slug ?? slugify(data.title)
  if (!SLUG_RE.test(slug)) slug = slugify(data.title)

  // Disambiguate on collision: slug, slug-2, slug-3, …
  let attempt = 1
  let candidate = slug
  while (await ps.findOne({ slug: candidate }, { projection: { _id: 1 } })) {
    attempt++
    candidate = `${slug}-${attempt}`
    if (attempt > 50) break
  }
  slug = candidate

  const now = new Date()
  const doc: Post = {
    slug,
    title: data.title,
    summary: data.summary,
    body: data.body,
    coverImage: data.coverImage || undefined,
    tags: data.tags,
    status: data.status,
    author: process.env.SITE_AUTHOR ?? "Nandishwar Singh",
    publishedAt: data.status === "published" ? now : undefined,
    createdAt: now,
    updatedAt: now,
    seo: {
      metaTitle: data.seo.metaTitle,
      metaDescription: data.seo.metaDescription,
      keywords: data.seo.keywords,
      canonicalUrl: data.seo.canonicalUrl,
      ogImage: data.seo.ogImage,
    },
    views: 0,
  }
  await ps.insertOne(doc)
  if (data.status === "published") {
    void pingIndexNow([
      `${SITE.origin}/blog/${slug}`,
      `${SITE.origin}/blog`,
      `${SITE.origin}/sitemap.xml`,
    ]).catch(() => {})
  }
  return Response.json({ slug, ok: true })
}
