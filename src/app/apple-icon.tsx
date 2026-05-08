import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #1b1b1f 0%, #0a0a0a 100%)",
          color: "#f5f5f5",
          fontWeight: 700,
          fontSize: 92,
          letterSpacing: -3,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        NS
      </div>
    ),
    { ...size }
  )
}
