import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { posts } from "@/lib/db"
import { JsonLd } from "@/components/seo/JsonLd"
import { PERSON, SITE, WEBSITE } from "@/lib/site"

export const dynamic = "force-dynamic"

const SITE_ORIGIN = SITE.origin
const PAGE_SIZE = 4

export const metadata = {
  title: "Blog — Nandishwar Singh",
  description:
    "Notes, write-ups, and walkthroughs by Nandishwar Singh on shipping software, side projects, and the stack behind nandishwarsingh.com.",
  keywords: [
    "Nandishwar Singh blog",
    "engineering blog",
    "Next.js write-ups",
    "side project notes",
    "yt-dlp tutorials",
    "QR analytics",
  ],
  alternates: {
    canonical: `${SITE_ORIGIN}/blog`,
    types: {
      "application/atom+xml": [
        { url: "/blog/feed.xml", title: "Nandishwar Singh — Blog" },
      ],
      "application/rss+xml": [
        { url: "/blog/feed.xml", title: "Nandishwar Singh — Blog" },
      ],
    },
  },
  openGraph: {
    title: "Blog — Nandishwar Singh",
    description:
      "Notes, write-ups, and walkthroughs from a software engineer who ships side projects.",
    url: `${SITE_ORIGIN}/blog`,
    type: "website",
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Nandishwar Singh",
    description:
      "Notes, write-ups, and walkthroughs from a software engineer who ships side projects.",
  },
}

type BlogPageProps = {
  searchParams: Promise<{ page?: string | string[] }>
}

function parsePage(raw: string | string[] | undefined): number {
  const v = Array.isArray(raw) ? raw[0] : raw
  const n = Number.parseInt(v ?? "1", 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

export default async function BlogIndexPage({ searchParams }: BlogPageProps) {
  const ps = await posts()
  const filter = { status: "published" as const }
  const total = await ps.countDocuments(filter)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const requested = parsePage((await searchParams).page)
  const page = Math.min(requested, totalPages)
  const skip = (page - 1) * PAGE_SIZE
  const list = await ps
    .find(filter, { projection: { body: 0 } })
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(PAGE_SIZE)
    .toArray()
  const hasPrev = page > 1
  const hasNext = page < totalPages
  const pageHref = (n: number) => (n <= 1 ? "/blog" : `/blog?page=${n}`)

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_ORIGIN}/blog#blog`,
    name: "Nandishwar Singh — Blog",
    url: `${SITE_ORIGIN}/blog`,
    description:
      "Long-form notes on building this site, side projects, and the engineering behind them — by Nandishwar Singh.",
    inLanguage: "en",
    author: { "@id": PERSON.id },
    publisher: { "@id": PERSON.id },
    isPartOf: { "@id": WEBSITE.id },
    blogPost: list.map((p) => ({
      "@type": "BlogPosting",
      "@id": `${SITE_ORIGIN}/blog/${p.slug}#article`,
      headline: p.title,
      description: p.summary,
      url: `${SITE_ORIGIN}/blog/${p.slug}`,
      datePublished: p.publishedAt?.toString(),
      dateModified: p.updatedAt?.toString(),
      author: { "@id": PERSON.id },
      keywords: (p.seo?.keywords ?? p.tags ?? []).join(", "),
    })),
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_ORIGIN },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_ORIGIN}/blog`,
      },
    ],
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10 lg:px-6 lg:py-14">
      <JsonLd data={blogJsonLd} />
      <JsonLd data={breadcrumbLd} />
      <header className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground">
          <BookOpen className="size-3.5" />
          Blog
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Notes & write-ups
        </h1>
        <p className="text-sm text-muted-foreground">
          Long-form posts on shipping software, building side projects, and
          everything that goes into running this site.
        </p>
      </header>

      {list.length === 0 ? (
        <Card className="flex items-center justify-center p-10 text-sm text-muted-foreground">
          No posts published yet — come back soon.
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="group block"
                aria-label={p.title}
              >
                <Card className="flex flex-col gap-3 overflow-hidden p-0 transition-colors hover:bg-card/80 sm:flex-row">
                  {p.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverImage}
                      alt={`${p.title} — cover image`}
                      loading="lazy"
                      decoding="async"
                      className="aspect-video w-full shrink-0 object-cover sm:aspect-square sm:w-44"
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-2 p-5">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Calendar className="size-3" />
                      {p.publishedAt
                        ? new Date(p.publishedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-foreground">
                      {p.title}
                    </h2>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {p.summary}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {p.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                        Read
                        <ArrowUpRight className="size-3.5" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between gap-3 pt-2 text-xs text-muted-foreground"
          aria-label="Blog pagination"
        >
          {hasPrev ? (
            <Link
              href={pageHref(page - 1)}
              rel="prev"
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 px-3 py-1 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Previous
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/20 px-3 py-1 opacity-50">
              <ArrowLeft className="size-3.5" />
              Previous
            </span>
          )}
          <span aria-live="polite">
            Page {page} of {totalPages}
          </span>
          {hasNext ? (
            <Link
              href={pageHref(page + 1)}
              rel="next"
              className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/40 px-3 py-1 transition-colors hover:text-foreground"
            >
              Next
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-background/20 px-3 py-1 opacity-50">
              Next
              <ArrowRight className="size-3.5" />
            </span>
          )}
        </nav>
      )}

      <footer className="flex justify-between pt-2 text-[11px] text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          ← Home
        </Link>
        <Link href="/tools" className="hover:text-foreground">
          Tools →
        </Link>
      </footer>
    </main>
  )
}
