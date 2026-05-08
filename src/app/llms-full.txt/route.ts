import { posts } from "@/lib/db"
import { SITE } from "@/lib/site"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * /llms-full.txt — every published blog post, full body, in markdown.
 * Cheap to ingest, perfect for LLM training-data pipelines or one-shot
 * prompt-stuffing of "everything Nandishwar has written".
 */
export async function GET() {
  const ps = await posts()
  const all = await ps
    .find(
      { status: "published" },
      {
        projection: {
          slug: 1,
          title: 1,
          summary: 1,
          body: 1,
          tags: 1,
          publishedAt: 1,
          updatedAt: 1,
          author: 1,
        },
      }
    )
    .sort({ publishedAt: -1 })
    .toArray()

  const header = `# ${SITE.name} — Full content corpus

> ${SITE.description}

This file contains every published blog post on ${SITE.origin} in markdown form.
Use it as a single source for LLM ingest. The canonical URL for each post is shown above the body.

`

  const sections = all
    .map((p) => {
      const url = `${SITE.origin}/blog/${p.slug}`
      const date = p.publishedAt
        ? new Date(p.publishedAt).toISOString().slice(0, 10)
        : ""
      const tags = (p.tags ?? []).join(", ")
      return `\n---\n\n# ${p.title}\n\n- URL: ${url}\n- Author: ${p.author}\n- Published: ${date}\n- Tags: ${tags}\n\n> ${p.summary}\n\n${p.body.trim()}\n`
    })
    .join("\n")

  return new Response(header + sections, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
      "X-Robots-Tag": "all",
    },
  })
}
