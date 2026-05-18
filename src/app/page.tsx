import type { Metadata } from "next"
import { SideLeft } from "@/components/portfolio/side-left"
import { SideRight } from "@/components/portfolio/side-right"
import { ToolCard } from "@/components/tools/shared/ToolCard"
import { TOOLS, EXPERIMENTS, NEWS, ALL_TOOLS } from "@/components/tools/shared/tools"
import { MyBlogsSection } from "@/components/blog/MyBlogsSection"
import { JsonLd } from "@/components/seo/JsonLd"
import { MotionFade } from "@/components/motion/MotionFade"
import { PERSON, SITE, WEBSITE } from "@/lib/site"

export const revalidate = 60

export const metadata: Metadata = {
  title: `${SITE.name} — Portfolio + free web tools (QR studio, blog)`,
  description:
    "Portfolio of Nandishwar Singh. Long-form engineering blog, QR code studio with click analytics, and a public live-traffic dashboard. No sign-up.",
  keywords: [
    ...SITE.primaryKeywords,
    "Nandishwar Singh portfolio",
    "engineering blog",
    "trackable QR codes",
    "no sign-up tools",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} — Portfolio + engineering blog + free web tools`,
    description:
      "Engineering blog, QR studio with click analytics, public live-traffic dashboard. No sign-up.",
    url: "/",
    type: "website",
  },
}

export default function Home() {
  const profileLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${SITE.origin}/#profilepage`,
    name: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.origin,
    inLanguage: SITE.language,
    mainEntity: { "@id": PERSON.id },
    about: { "@id": PERSON.id },
    isPartOf: { "@id": WEBSITE.id },
    dateModified: new Date().toISOString(),
    primaryImageOfPage: PERSON.image,
  }

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE.origin}/#tools-collection`,
    name: "Free web tools by Nandishwar Singh",
    description:
      "Small, focused web tools shipped on nandishwarsingh.com — every one free, no sign-up.",
    url: SITE.origin,
    inLanguage: SITE.language,
    isPartOf: { "@id": WEBSITE.id },
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: ALL_TOOLS.length,
      itemListElement: ALL_TOOLS.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE.origin}/tools/${t.slug}`,
        item: {
          "@type": "SoftwareApplication",
          name: t.name,
          description: t.description,
          url: `${SITE.origin}/tools/${t.slug}`,
          applicationCategory: "WebApplication",
          operatingSystem: "Any",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            availability:
              t.status === "shipped"
                ? "https://schema.org/InStock"
                : "https://schema.org/PreOrder",
          },
          author: { "@id": PERSON.id },
          publisher: { "@id": PERSON.id },
        },
      })),
    },
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.origin },
    ],
  }

  return (
    <>
      {/* Subtle fixed gradient backdrop visible behind the whole layout */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.3_0.04_152/0.35),transparent_60%),radial-gradient(ellipse_50%_40%_at_90%_100%,oklch(0.3_0.04_30/0.18),transparent_60%)]"
      />

      <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-8 px-4 py-8 lg:px-6 lg:py-10">
        <JsonLd data={profileLd} />
        <JsonLd data={collectionLd} />
        <JsonLd data={breadcrumbLd} />

        <h1 className="sr-only">
          {SITE.name} — {SITE.tagline}
        </h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
          <SideLeft />

          <div className="flex min-w-0 flex-col gap-7">
            <MotionFade delay={0.04}>
              <MyBlogsSection variant="stack" limit={4} />
            </MotionFade>

            <MotionFade delay={0.16}>
              <section aria-labelledby="tools-heading" className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="size-1.5 rounded-full bg-foreground/40" />
                    <h2
                      id="tools-heading"
                      className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
                    >
                      Tools
                    </h2>
                  </div>
                  <a
                    href="/tools"
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View all →
                  </a>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {TOOLS.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </section>
            </MotionFade>

            <MotionFade delay={0.20}>
              <section aria-labelledby="experiments-heading" className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_oklch(0.7_0.18_152)]" />
                    <h2
                      id="experiments-heading"
                      className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
                    >
                      Experiments
                    </h2>
                  </div>
                  <span className="text-[10px] text-muted-foreground/70">live R&amp;D</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {EXPERIMENTS.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </section>
            </MotionFade>
            <MotionFade delay={0.24}>
              <section aria-labelledby="news-heading" className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_oklch(0.78_0.16_75)]" />
                    <h2
                      id="news-heading"
                      className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
                    >
                      News
                    </h2>
                  </div>
                  <span className="text-[10px] text-muted-foreground/70">live publication</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {NEWS.map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </section>
            </MotionFade>

          </div>

          <SideRight />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[11px] text-muted-foreground">
          <span>© {new Date().getFullYear()} Nandishwar Singh</span>
          <span className="flex items-center gap-3">
            <a
              href="/stats"
              className="transition-colors hover:text-foreground"
              title="Public live traffic for this site"
            >
              Live stats →
            </a>
            <span>Built with Next.js.</span>
          </span>
        </footer>
      </main>
    </>
  )
}
