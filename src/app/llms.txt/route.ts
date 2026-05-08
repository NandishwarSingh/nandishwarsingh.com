import { posts } from "@/lib/db"
import { TOOLS } from "@/components/tools/shared/tools"
import { SITE } from "@/lib/site"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * /llms.txt — curated index for AI crawlers per https://llmstxt.org/.
 * Lean on purpose: site description, primary tool surfaces, recent posts,
 * and links to the full-content variant.
 */
export async function GET() {
  const ps = await posts()
  const recent = await ps
    .find(
      { status: "published" },
      { projection: { slug: 1, title: 1, summary: 1, publishedAt: 1 } }
    )
    .sort({ publishedAt: -1 })
    .limit(20)
    .toArray()

  const toolsLines = TOOLS.filter((t) => t.status === "shipped").map(
    (t) => `- [${t.name}](${SITE.origin}/tools/${t.slug}): ${t.tagline}`
  )

  const recentLines = recent.map(
    (p) => `- [${p.title}](${SITE.origin}/blog/${p.slug}): ${p.summary}`
  )

  const body = `# ${SITE.name}

> ${SITE.description}

Maintained by Nandishwar Singh — software engineer building free, useful tools on the web. Source: this site, no organisation behind it.

## Free tools

${toolsLines.join("\n")}

- [QR short-link redirector](${SITE.origin}/r/[slug]): Tracked redirects from /r/&lt;slug&gt; created via the QR Studio.
- [Public live-traffic dashboard](${SITE.origin}/stats): Real-time anonymised stats — visits, sessions, country mix, per-tool usage, bounce rate. No login.

## Blog (most recent)

${recentLines.join("\n")}

## Index

- [All tools](${SITE.origin}/tools)
- [All blog posts](${SITE.origin}/blog)
- [Live stats dashboard](${SITE.origin}/stats)
- [Sitemap (XML)](${SITE.origin}/sitemap.xml)
- [Full markdown corpus for LLM ingest](${SITE.origin}/llms-full.txt)
`

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
      "X-Robots-Tag": "all",
    },
  })
}
