import type { MetadataRoute } from "next"
import { posts } from "@/lib/db"
import { TOOLS } from "@/components/tools/shared/tools"
import { SITE } from "@/lib/site"

const SITE_ORIGIN = SITE.origin

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ps = await posts()
  const published = await ps
    .find(
      { status: "published" },
      { projection: { slug: 1, updatedAt: 1, publishedAt: 1 } }
    )
    .sort({ publishedAt: -1 })
    .limit(500)
    .toArray()

  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_ORIGIN}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_ORIGIN}/tools`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_ORIGIN}/tools/best-free-qr-code-generators`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${SITE_ORIGIN}/tools/best-social-media-video-downloaders`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${SITE_ORIGIN}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_ORIGIN}/stats`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.5,
    }
  ]

  const toolEntries: MetadataRoute.Sitemap = TOOLS.map((t) => ({
    url: `${SITE_ORIGIN}/tools/${t.slug}`,
    lastModified: now,
    changeFrequency: t.status === "shipped" ? "weekly" : "monthly",
    priority: t.status === "shipped" ? 0.85 : 0.4,
  }))

  const blogEntries: MetadataRoute.Sitemap = published.map((p) => ({
    url: `${SITE_ORIGIN}/blog/${p.slug}`,
    lastModified: p.updatedAt ?? p.publishedAt ?? now,
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  return [...staticEntries, ...toolEntries, ...blogEntries]
}
