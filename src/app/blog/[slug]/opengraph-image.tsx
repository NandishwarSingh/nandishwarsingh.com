import { ImageResponse } from "next/og"
import { posts } from "@/lib/db"

export const runtime = "nodejs"
export const alt = "Blog post — Nandishwar Singh"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function BlogPostOg({
  params,
}: {
  params: { slug: string }
}) {
  const ps = await posts()
  const p = await ps.findOne(
    { slug: params.slug, status: "published" },
    { projection: { title: 1, summary: 1, tags: 1, publishedAt: 1, author: 1 } }
  )
  const title = p?.title ?? "Nandishwar Singh — Blog"
  const summary =
    p?.summary ?? "Long-form notes on shipping software and side projects."
  const tag = p?.tags?.[0] ?? "blog"
  const date = p?.publishedAt
    ? new Date(p.publishedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : ""
  const author = p?.author ?? "Nandishwar Singh"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse 70% 60% at 80% 20%, rgba(231,178,201,0.2) 0%, rgba(231,178,201,0) 60%), linear-gradient(135deg, #1b1b1f 0%, #0a0a0a 100%)",
          color: "#f5f5f5",
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#a1a1aa",
            fontSize: 20,
          }}
        >
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid rgba(231,178,201,0.4)",
              background: "rgba(231,178,201,0.1)",
              color: "#E7B2C9",
              fontSize: 16,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            #{tag}
          </div>
          {date && <div>· {date}</div>}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: title.length > 60 ? 56 : 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1.5,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#a1a1aa",
              lineHeight: 1.4,
              maxWidth: 1000,
            }}
          >
            {summary.length > 200 ? summary.slice(0, 197) + "…" : summary}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#a1a1aa",
            fontSize: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #1b1b1f 0%, #0a0a0a 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                color: "#f5f5f5",
              }}
            >
              NS
            </div>
            {author}
          </div>
          <div>nandishwarsingh.com/blog</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
