import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Hourglass } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getTool } from "@/components/tools/shared/tools"
import { JsonLd } from "@/components/seo/JsonLd"
import { PERSON, SITE, WEBSITE } from "@/lib/site"

type Params = { slug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const tool = getTool(slug)
  if (!tool) return {}
  const url = `${SITE.origin}/tools/${tool.slug}`
  return {
    title: `${tool.name} — Nandishwar Singh`,
    description: tool.description,
    keywords: [tool.name, tool.tagline, "free tool", "Nandishwar Singh"],
    alternates: { canonical: url },
    openGraph: {
      title: `${tool.name} — Nandishwar Singh`,
      description: tool.description,
      url,
      type: "website",
      siteName: SITE.name,
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.name} — Nandishwar Singh`,
      description: tool.description,
    },
  }
}

export default async function ToolPlaceholderPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const tool = getTool(slug)
  if (!tool) notFound()
  if (tool.status === "shipped") notFound()

  const Icon = tool.icon
  const url = `${SITE.origin}/tools/${tool.slug}`

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${url}#software`,
    name: tool.name,
    description: tool.description,
    url,
    applicationCategory: "WebApplication",
    operatingSystem: "Any",
    author: { "@id": PERSON.id },
    publisher: { "@id": PERSON.id },
    isPartOf: { "@id": WEBSITE.id },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
    },
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.origin },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tools",
        item: `${SITE.origin}/tools`,
      },
      { "@type": "ListItem", position: 3, name: tool.name, item: url },
    ],
  }

  return (
    <section className="flex h-full flex-col">
      <JsonLd data={softwareLd} />
      <JsonLd data={breadcrumbLd} />

      <Card className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden p-12 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-30 blur-3xl"
          style={{
            background: `radial-gradient(ellipse at top, ${tool.accent}, transparent 60%)`,
          }}
        />

        <div
          className="relative inline-flex size-14 items-center justify-center rounded-xl border border-border/60 bg-background/60"
          style={{ color: tool.accent }}
        >
          <Icon className="size-6" />
        </div>

        <div className="relative flex flex-col items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            <Hourglass className="size-3" />
            On the roadmap
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">{tool.name}</h1>
          <p className="text-sm text-muted-foreground">{tool.tagline}</p>
        </div>

        <p className="relative max-w-md text-sm leading-relaxed text-foreground/80">
          {tool.description}
        </p>

        {tool.comingReason && (
          <p className="relative text-xs text-muted-foreground">
            Blocked on: <span className="text-foreground">{tool.comingReason}</span>
          </p>
        )}

        <div className="relative flex gap-2">
          <Button asChild variant="outline">
            <Link href="/tools">
              <ArrowLeft className="size-4" />
              All tools
            </Link>
          </Button>
          <Button asChild>
            <Link href="/tools/downloader">Try the live one</Link>
          </Button>
        </div>
      </Card>
    </section>
  )
}
