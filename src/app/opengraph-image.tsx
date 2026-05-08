import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const alt = "Nandishwar Singh — portfolio + free web tools"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function HomeOg() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse 80% 60% at 30% 30%, rgba(202,220,252,0.25) 0%, rgba(202,220,252,0) 60%), linear-gradient(135deg, #1b1b1f 0%, #0a0a0a 100%)",
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
            gap: 16,
            color: "#a1a1aa",
            fontSize: 22,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #1b1b1f 0%, #0a0a0a 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              color: "#f5f5f5",
            }}
          >
            NS
          </div>
          nandishwarsingh.com
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: -2,
                maxWidth: 1000,
              }}
            >
              Nandishwar Singh
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#a1a1aa",
                lineHeight: 1.3,
                maxWidth: 900,
              }}
            >
              Portfolio + free web tools — social media downloader, QR studio with
              click analytics, public live-stats dashboard, builder-voice blog.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            color: "#a1a1aa",
            fontSize: 18,
          }}
        >
          {["Downloader", "QR Studio", "Live stats", "Blog"].map((t) => (
            <div
              key={t}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
