import { QrCode, Film, Newspaper, type LucideIcon } from "lucide-react"

export type ToolStatus = "shipped" | "in-progress" | "planned"

export type Tool = {
  slug: string
  name: string
  tagline: string
  description: string
  icon: LucideIcon
  status: ToolStatus
  accent: string
  comingReason?: string
  /** External or root-relative URL. When present, the card links here instead of /tools/{slug}. */
  href?: string
  /** Open in a new tab when true (default true for external https URLs). */
  external?: boolean
  /** Optional public source repository URL. Renders a small GitHub link on the card. */
  repo?: string
}

export const TOOLS: Tool[] = [
  {
    slug: "qr",
    name: "QR Studio",
    tagline: "Generate · customize · track clicks",
    description:
      "Design branded QR codes, share short links under /r/<slug>, and watch clicks roll in with per-country, per-device breakdowns.",
    icon: QrCode,
    status: "shipped",
    accent: "#cadcfc",
  },
]

export const EXPERIMENTS: Tool[] = [
  {
    slug: "nvc",
    name: "NVC Studio",
    tagline: "Neural video codec · WebGPU playback",
    description:
      "Drop a video, encode to a self-contained .nvc file (down to ~5% of the source size), and play it back in the browser with WebGPU-accelerated Real-ESRGAN super-resolution.",
    icon: Film,
    status: "shipped",
    accent: "#b6f2c4",
    href: "/nvc/",
    repo: "https://github.com/NandishwarSingh/NVC",
  },
]

export const NEWS: Tool[] = [
  {
    slug: "geopolitiq",
    name: "GeoPolitiq",
    tagline: "AI-curated geopolitics · daily analysis",
    description:
      "Live geopolitical intelligence covering USA, Europe, India, UK, and the Middle East. Verified-sourced articles with regional newsletters and a public RSS / podcast feed.",
    icon: Newspaper,
    status: "shipped",
    accent: "#f3bf6b",
    href: "https://geopolitiq.com/?utm_source=nandishwarsingh&utm_medium=portfolio&utm_campaign=tools_news",
    external: true,
    repo: "https://github.com/NandishwarSingh/GeoPolitiq",
  },
]

export const ALL_TOOLS: Tool[] = [...TOOLS, ...EXPERIMENTS, ...NEWS]

export function getTool(slug: string): Tool | undefined {
  return ALL_TOOLS.find((t) => t.slug === slug)
}

