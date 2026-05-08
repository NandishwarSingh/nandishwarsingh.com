import type { MetadataRoute } from "next"
import { SITE } from "@/lib/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: SITE.themeColor,
    theme_color: SITE.themeColor,
    lang: SITE.language,
    categories: ["productivity", "utilities", "developer"],
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png", purpose: "any" },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/me.jpg", sizes: "any", type: "image/jpeg", purpose: "any" },
    ],
    shortcuts: [
      {
        name: "Blog",
        short_name: "Blog",
        url: "/blog",
        description: "Long-form notes and write-ups",
      },
      {
        name: "QR studio",
        short_name: "QR",
        url: "/tools/qr",
        description: "Generate trackable QR codes",
      },
      {
        name: "Live stats",
        short_name: "Stats",
        url: "/stats",
        description: "Public real-time traffic dashboard",
      }
    ],
  }
}
