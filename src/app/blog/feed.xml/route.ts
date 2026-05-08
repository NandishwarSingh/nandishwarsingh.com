import { posts } from "@/lib/db"
import { PERSON, SITE } from "@/lib/site"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`
}

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
    .limit(50)
    .toArray()

  const updated =
    all[0]?.updatedAt?.toISOString?.() ?? new Date().toISOString()

  const entries = all
    .map((p) => {
      const url = `${SITE.origin}/blog/${p.slug}`
      const published = p.publishedAt?.toISOString?.() ?? updated
      const modified = p.updatedAt?.toISOString?.() ?? published
      const tags = (p.tags ?? [])
        .map(
          (t) =>
            `    <category term="${xmlEscape(t)}" label="${xmlEscape(t)}"/>`
        )
        .join("\n")
      return `  <entry>
    <id>${url}</id>
    <title>${xmlEscape(p.title)}</title>
    <link rel="alternate" type="text/html" href="${url}"/>
    <published>${published}</published>
    <updated>${modified}</updated>
    <summary type="text">${xmlEscape(p.summary)}</summary>
    <content type="text">${cdata(p.body)}</content>
${tags}
  </entry>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${SITE.origin}/blog</id>
  <title>${xmlEscape(SITE.name)} — Blog</title>
  <subtitle>${xmlEscape(SITE.description)}</subtitle>
  <link rel="alternate" type="text/html" href="${SITE.origin}/blog"/>
  <link rel="self" type="application/atom+xml" href="${SITE.origin}/blog/feed.xml"/>
  <updated>${updated}</updated>
  <author>
    <name>${xmlEscape(PERSON.name)}</name>
    <uri>${PERSON.url}</uri>
    <email>${PERSON.email}</email>
  </author>
  <rights>© ${new Date().getFullYear()} ${xmlEscape(PERSON.name)}</rights>
  <generator uri="${SITE.origin}">nandishwarsingh.com</generator>
${entries}
</feed>`

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
      "X-Robots-Tag": "all",
    },
  })
}
