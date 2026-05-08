import { ImageResponse } from "next/og"
import { getTool } from "@/components/tools/shared/tools"

export const runtime = "nodejs"
export const alt = "Tool — Nandishwar Singh"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function ToolOg({
  params,
}: {
  params: { slug: string }
}) {
  const tool = getTool(params.slug)
  const name = tool?.name ?? "Tool — nandishwarsingh.com"
  const tagline =
    tool?.tagline ?? "A small, useful, free tool by Nandishwar Singh."
  const accent = tool?.accent ?? "#7A9FD8"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `radial-gradient(ellipse 70% 60% at 30% 80%, ${accent}33 0%, ${accent}00 60%), linear-gradient(135deg, #1b1b1f 0%, #0a0a0a 100%)`,
          color: "#f5f5f5",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "#a1a1aa",
            fontSize: 20,
          }}
        >
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: `1px solid ${accent}66`,
              background: `${accent}1a`,
              color: accent,
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            Free tool
          </div>
          <div>nandishwarsingh.com</div>
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
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 1040,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#a1a1aa",
              lineHeight: 1.35,
              maxWidth: 1000,
            }}
          >
            {tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#a1a1aa",
            fontSize: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
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
            By Nandishwar Singh
          </div>
          <div
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              background: accent,
              color: "#0a0a0a",
              fontWeight: 600,
            }}
          >
            Try it free
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
