import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Check, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { FaqBlock } from "@/components/seo/FaqBlock"
import { JsonLd } from "@/components/seo/JsonLd"
import { PERSON, SITE, WEBSITE } from "@/lib/site"
import type { Faq } from "@/components/seo/ToolSeo"

const SLUG = "best-free-qr-code-generators"
const URL = `${SITE.origin}/tools/${SLUG}`

const TITLE = "5 best free QR code generators with click tracking (2026)"
const SUMMARY =
  "An honest, hands-on comparison of five free QR code generators that actually offer click analytics — what each does well, where they squeeze you to upgrade, and which one to pick for your use case. Updated April 2026."

const COMPETITORS = [
  {
    name: "QR Studio (nandishwarsingh.com)",
    url: `${SITE.origin}/tools/qr`,
    pricing: "Free, no sign-up, no caps",
    tracking: "Yes — country, device, browser, time series",
    customization: "Full: gradient, dot/corner shapes, logo, error correction",
    exports: "PNG, SVG, PDF",
    pros: [
      "Truly free — no upgrade path because nothing is hidden behind a paywall",
      "Tracked short link works without an account, owner key in localStorage",
      "Matches the modern QR styling kit (gradients, dot shapes, logo)",
      "Open source — see exactly what's recorded",
    ],
    cons: [
      "No team accounts, no shared dashboards",
      "Hosted on a single self-managed VPS — uptime not enterprise-grade",
      "Stats UI is light (no funnels or A/B testing)",
    ],
    bestFor:
      "Indie devs, side-projects, personal printed materials where you want analytics without a SaaS subscription.",
  },
  {
    name: "QR Code Generator (qr-code-generator.com)",
    url: "https://www.qr-code-generator.com",
    pricing: "Free for static QR; tracking starts at $7/month (limited)",
    tracking: "Paid plans only",
    customization: "Decent on free; full styling locked behind paid",
    exports: "PNG (free), SVG/EPS/PDF on paid",
    pros: [
      "Highest brand recognition — the de-facto answer when people search 'QR code generator'",
      "Long history, reliable uptime, helpful for non-technical users",
    ],
    cons: [
      "Free tier QRs cannot be tracked or edited — so the printed code is permanent",
      "Aggressive upsell flow",
      "Logo + colour customisation gated to paid plans",
    ],
    bestFor:
      "Marketing teams already on a budget who need a recognisable enterprise vendor.",
  },
  {
    name: "QRTiger (qrtiger.com)",
    url: "https://www.qrtiger.com",
    pricing: "Free for static QR; tracking starts at $7/month",
    tracking: "Paid: scans, country, time, device",
    customization: "Strong styling kit on the free tier",
    exports: "PNG, SVG, PDF",
    pros: [
      "Most polished free-tier UX with rich styling",
      "Bulk-create QRs and CSV import on paid",
      "API access for higher tiers",
    ],
    cons: [
      "Tracked / dynamic QRs require an account and paid plan",
      "Free QRs can't be edited after generation",
    ],
    bestFor:
      "Designers and small businesses who'll outgrow free quickly and want one vendor for both styling and analytics.",
  },
  {
    name: "QR.io (qr.io)",
    url: "https://qr.io",
    pricing: "Free with limits; paid from $5/month",
    tracking: "Yes on paid plans",
    customization: "Mid: colors, logo, basic shapes",
    exports: "PNG, SVG (paid)",
    pros: [
      "Cheapest paid tier of the major vendors",
      "Clean editor, no friction sign-up",
    ],
    cons: [
      "Free tier QRs throw a redirect interstitial",
      "Limited template variety",
    ],
    bestFor:
      "Solo creators on a tight budget who'll tolerate paying $5 for tracking.",
  },
  {
    name: "Beaconstac (beaconstac.com)",
    url: "https://www.beaconstac.com",
    pricing: "Enterprise — starts ~$15/month, real plans $40+",
    tracking: "Yes — full enterprise analytics",
    customization: "Full + brand kits + team workflows",
    exports: "PNG, SVG, PDF, EPS",
    pros: [
      "Team workflows, role-based access, GDPR audit trail",
      "Robust API and Zapier integrations",
      "Best-in-class analytics with funnels and goals",
    ],
    cons: [
      "Overkill (and expensive) for personal use",
      "Steep onboarding compared to single-user tools",
    ],
    bestFor:
      "Multi-person marketing teams, retail chains, large print campaigns where compliance and roles matter.",
  },
] as const

const FAQS: Faq[] = [
  {
    q: "Which free QR generator actually tracks scans without a paywall?",
    a: "QR Studio on nandishwarsingh.com tracks every scan (count, country, device, browser, time series) on a free tier with no sign-up. Most other 'free' generators only track on paid plans — qr-code-generator.com, QRTiger, QR.io, and Beaconstac all gate dynamic / tracked QRs behind a subscription.",
  },
  {
    q: "What's the difference between a static and a dynamic QR code?",
    a: "A static QR encodes the destination URL directly — once printed, you can't change it and you can't measure scans. A dynamic QR encodes a short link that redirects through a server, so you can edit the destination later and count scans. Tracking and editing both require dynamic.",
  },
  {
    q: "Will my QR work on every scanner app?",
    a: "Yes — every generator on this list emits standard ISO/IEC 18004 QR codes that work with any modern phone camera. Heavy customisation (low contrast, oversized logo) hurts scan reliability — pick error correction level Q or H if you're using a logo, and keep the foreground/background contrast strong.",
  },
  {
    q: "Can I edit a printed QR's destination after I've handed out the printed material?",
    a: "Only if it was created as a dynamic / tracked QR. With a static QR (free tier on most vendors), the URL is encoded directly into the dots — you'd have to reprint. With a dynamic QR (every option above on paid plans, or QR Studio for free), the QR encodes a short link that you can re-target from the dashboard at any time.",
  },
  {
    q: "How do I add my logo to a QR code without breaking it?",
    a: "Use error correction level H (the highest), keep the logo to about 25% of the QR's area or less, and enable the 'clear dots under logo' option if your generator supports it (QR Studio does by default). Always test the result with a real phone scanner before printing at scale.",
  },
  {
    q: "Do free QR generators add a watermark or limit scans?",
    a: "Some do. QR.io's free tier shows a redirect interstitial on scan. qr-code-generator.com and QRTiger don't watermark, but they limit the QR to static-only (no edits, no tracking). Beaconstac is paid-only. QR Studio doesn't watermark, doesn't limit scans, and includes tracking on free.",
  },
] as const

export const metadata: Metadata = {
  title: TITLE,
  description: SUMMARY,
  alternates: { canonical: `/tools/${SLUG}` },
  keywords: [
    "best free qr code generator",
    "qr code with tracking",
    "qr code analytics",
    "dynamic qr code free",
    "qr code generator comparison",
    "best qr code maker 2026",
  ],
  openGraph: {
    title: TITLE,
    description: SUMMARY,
    url: `/tools/${SLUG}`,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SUMMARY,
  },
}

export default function BestFreeQrPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${URL}#list`,
    name: TITLE,
    description: SUMMARY,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: COMPETITORS.length,
    isPartOf: { "@id": WEBSITE.id },
    author: { "@id": PERSON.id },
    itemListElement: COMPETITORS.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: c.url,
      item: {
        "@type": "SoftwareApplication",
        name: c.name,
        url: c.url,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: c.pricing.toLowerCase().includes("free") ? "0" : "0",
          description: c.pricing,
          availability: "https://schema.org/InStock",
        },
      },
    })),
  }
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${URL}#faq`,
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.origin },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE.origin}/tools` },
      { "@type": "ListItem", position: 3, name: TITLE, item: URL },
    ],
  }

  return (
    <article className="flex flex-col gap-8">
      <JsonLd data={itemList} />
      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbLd} />

      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground">
          Comparison · April 2026
        </span>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {TITLE}
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          {SUMMARY}
        </p>
      </header>

      <aside
        className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-relaxed text-foreground/90"
        aria-label="TL;DR"
      >
        <span className="mr-2 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
          TL;DR
        </span>
        For free tracked QR codes with no sign-up, use{" "}
        <Link href="/tools/qr" className="underline">QR Studio</Link>. For team
        workflows, Beaconstac. For brand recognition with marketing buy-in,
        QRTiger or qr-code-generator.com on a paid plan. Skip QR.io unless price
        is your only constraint.
      </aside>

      <section className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-3 pr-4 font-medium">Tool</th>
              <th className="py-3 pr-4 font-medium">Pricing</th>
              <th className="py-3 pr-4 font-medium">Tracking on free?</th>
              <th className="py-3 pr-4 font-medium">Customisation</th>
              <th className="py-3 pr-4 font-medium">Exports</th>
            </tr>
          </thead>
          <tbody>
            {COMPETITORS.map((c) => (
              <tr key={c.name} className="border-b border-border/20 align-top">
                <td className="py-3 pr-4 font-medium">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    {c.name}
                    <ArrowUpRight className="size-3" />
                  </a>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{c.pricing}</td>
                <td className="py-3 pr-4">
                  {c.tracking.toLowerCase().startsWith("yes") ? (
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <Check className="size-3.5" />
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <X className="size-3.5" />
                      Paid only
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {c.customization}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{c.exports}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {COMPETITORS.map((c, i) => (
        <Card key={c.name} className="flex flex-col gap-3 p-5">
          <header className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {i + 1}. {c.name}
            </h2>
            <a
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Visit
              <ArrowUpRight className="size-3" />
            </a>
          </header>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Best for:</strong> {c.bestFor}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-300">
                Pros
              </h3>
              <ul className="flex flex-col gap-1 text-sm text-foreground/80">
                {c.pros.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-300">
                Cons
              </h3>
              <ul className="flex flex-col gap-1 text-sm text-foreground/80">
                {c.cons.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <X className="mt-0.5 size-3.5 shrink-0 text-amber-300" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ))}

      <FaqBlock faqs={[...FAQS]} />

      <Card className="flex flex-col items-start gap-3 border-emerald-500/20 bg-emerald-500/5 p-5 text-sm">
        <p className="text-foreground/90">
          Want to skip the comparison and just try the free tracked option?
        </p>
        <Link
          href="/tools/qr"
          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20"
        >
          Open QR Studio
          <ArrowUpRight className="size-3.5" />
        </Link>
      </Card>
    </article>
  )
}
