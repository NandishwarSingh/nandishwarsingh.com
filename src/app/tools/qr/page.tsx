import type { Metadata } from "next"
import { MyQrs } from "@/components/tools/qr/MyQrs"
import { QrStudio } from "@/components/tools/qr/QrStudio"
import { FaqBlock } from "@/components/seo/FaqBlock"
import { ToolSeo, type Faq } from "@/components/seo/ToolSeo"
import { SITE } from "@/lib/site"

const NAME = "Free QR code generator with click tracking and full styling"
const TAGLINE =
  "Design a branded QR code with custom colors, gradients, dot shapes, and a logo. Get a tracked short link and a real-time click dashboard with country, device, and browser breakdowns. No sign-up."

const FEATURES = [
  "Full styling: colors, gradients, dot shapes, corner styles, logo, error correction level",
  "Export PNG, SVG, or PDF at any resolution",
  "Tracked short URL on /r/<slug>",
  "Real-time click dashboard with country, device, and browser breakdowns",
  "Edit target URL or styling later without invalidating the printed QR",
  "All QR codes you create are saved on your device — no account needed",
]

const FAQS: Faq[] = [
  {
    q: "Is this QR code generator really free?",
    a: "Yes. No sign-up, no daily limit, no watermark, no upsell. You can create unlimited tracked QR codes and customize them however you want.",
  },
  {
    q: "How does click tracking work without an account?",
    a: "When you create a QR code, the tool returns a one-time owner key that's saved in your browser's localStorage. The owner key lets you edit, delete, and view stats for that QR. The short link itself is public — anyone with it can scan and visit the target URL, and every scan is recorded.",
  },
  {
    q: "What does the analytics dashboard show?",
    a: "Total clicks, unique visitors, clicks over time, country breakdown (via offline IP geolocation), device type (mobile / desktop), browser, and OS. Plus a recent-clicks table with timestamps. No personal data — IPs are hashed before storage.",
  },
  {
    q: "Can I change the QR's target URL after I've printed it?",
    a: "Yes. The QR encodes the short link (nandishwarsingh.com/r/<slug>), and you can edit where that short link redirects from the dashboard. Useful for printed materials where the destination changes.",
  },
  {
    q: "Will my QR work on every scanner app?",
    a: "Yes. The QR uses standard ISO/IEC 18004 encoding. Heavy customization (low contrast, oversized logo) can hurt scan reliability — pick error correction level Q or H if you're using a logo, and keep the foreground/background contrast strong.",
  },
  {
    q: "What customization options are available?",
    a: "Foreground and background colors (solid or gradient), dot style (square / dots / rounded / classy), corner shapes (square / dot / extra-rounded), error correction level (L/M/Q/H), and a center logo upload. Captions are supported in the on-page preview.",
  },
  {
    q: "Can I export an SVG for print?",
    a: "Yes. PNG, SVG, and PDF exports are all available. SVG is recommended for print because it's resolution-independent.",
  },
  {
    q: "Will losing my browser data delete my QR codes?",
    a: "The QR codes themselves keep working — they live on the server. But you'll lose the owner keys that let you edit or delete them. Save the owner key from the success screen if you want backup access.",
  },
]

export const metadata: Metadata = {
  title: NAME,
  description: TAGLINE,
  alternates: { canonical: "/tools/qr" },
  keywords: [
    "qr code generator",
    "free qr code",
    "qr code with tracking",
    "qr code analytics",
    "branded qr code",
    "custom qr code",
    "qr code with logo",
    "qr code short link",
  ],
  openGraph: {
    title: `${NAME} — ${SITE.name}`,
    description: TAGLINE,
    url: "/tools/qr",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: NAME,
    description: TAGLINE,
  },
}

export default function QrToolPage() {
  return (
    <div className="flex flex-col gap-6">
      <ToolSeo
        slug="qr"
        name={NAME}
        description={TAGLINE}
        faqs={FAQS}
        features={FEATURES}
        applicationCategory="BusinessApplication"
      />

      <header className="sr-only">
        <h1>{NAME}</h1>
        <p>{TAGLINE}</p>
      </header>

      <QrStudio />
      <MyQrs />
      <FaqBlock faqs={FAQS} />
    </div>
  )
}
