import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
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
          fontSize: 32,
          letterSpacing: -1,
          fontFamily: "system-ui, -apple-system, sans-serif",
          borderRadius: 12,
        }}
      >
        NS
      </div>
    ),
    { ...size }
  )
}
