import type { Metadata } from "next"
import { ToolCard } from "@/components/tools/shared/ToolCard"
import { TOOLS } from "@/components/tools/shared/tools"
import { JsonLd } from "@/components/seo/JsonLd"
import { PERSON, SITE, WEBSITE } from "@/lib/site"

const SITE_ORIGIN = SITE.origin

export const metadata: Metadata = {
  title: "Tools — Nandishwar Singh",
  description:
    "Free, no-sign-up web tools by Nandishwar Singh: a 1,800-site video downloader, a QR code studio with click analytics, and more.",
  keywords: [
    "free web tools",
    "video downloader",
    "QR code generator",
    "yt-dlp web frontend",
    "no sign-up tools",
    "Nandishwar Singh tools",
  ],
  alternates: { canonical: `${SITE_ORIGIN}/tools` },
  openGraph: {
    title: "Tools — Nandishwar Singh",
    description:
      "Free, no-sign-up web tools by Nandishwar Singh — video downloader (1,800+ sites), QR code studio with click analytics.",
    url: `${SITE_ORIGIN}/tools`,
    type: "website",
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Tools — Nandishwar Singh",
    description:
      "Free, no-sign-up web tools — video downloader and QR studio with click analytics.",
  },
}

export default function ToolsIndexPage() {
  const shipped = TOOLS.filter((t) => t.status === "shipped")
  const inProgress = TOOLS.filter((t) => t.status === "in-progress")
  const planned = TOOLS.filter((t) => t.status === "planned")

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_ORIGIN}/tools#collection`,
    name: "Tools — Nandishwar Singh",
    description:
      "A collection of small, focused, free web tools shipped on nandishwarsingh.com.",
    url: `${SITE_ORIGIN}/tools`,
    inLanguage: SITE.language,
    isPartOf: { "@id": WEBSITE.id },
    author: { "@id": PERSON.id },
    publisher: { "@id": PERSON.id },
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: TOOLS.length,
      itemListElement: TOOLS.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_ORIGIN}/tools/${t.slug}`,
        item: {
          "@type": "SoftwareApplication",
          "@id": `${SITE_ORIGIN}/tools/${t.slug}#software`,
          name: t.name,
          description: t.description,
          url: `${SITE_ORIGIN}/tools/${t.slug}`,
          applicationCategory: "WebApplication",
          operatingSystem: "Any",
          author: { "@id": PERSON.id },
          publisher: { "@id": PERSON.id },
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            availability:
              t.status === "shipped"
                ? "https://schema.org/InStock"
                : "https://schema.org/PreOrder",
          },
        },
      })),
    },
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_ORIGIN },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tools",
        item: `${SITE_ORIGIN}/tools`,
      },
    ],
  }

  return (
    <section className="flex flex-col gap-8">
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tools</h1>
        <p className="text-sm text-muted-foreground">
          Small, focused utilities — some shipping, some in flight. All free, no
          sign-up.
        </p>
      </header>

      {shipped.length > 0 && <ToolGroup title="Live" tools={shipped} />}
      {inProgress.length > 0 && (
        <ToolGroup title="Building" tools={inProgress} />
      )}
      {planned.length > 0 && <ToolGroup title="Planned" tools={planned} />}
    </section>
  )
}

function ToolGroup({
  title,
  tools,
}: {
  title: string
  tools: typeof TOOLS
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <ToolCard key={t.slug} tool={t} />
        ))}
      </div>
    </div>
  )
}
