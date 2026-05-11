import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight, Calendar, Clock } from "lucide-react"
import { comments, posts, type Post } from "@/lib/db"
import { PostMarkdown } from "@/components/blog/PostMarkdown"
import { CommentSection } from "@/components/blog/CommentSection"
import { readingTimeMinutes } from "@/lib/posts"
import { JsonLd } from "@/components/seo/JsonLd"
import { PERSON, SITE, WEBSITE } from "@/lib/site"

export const dynamic = "force-dynamic"

const SITE_ORIGIN = SITE.origin

type Params = { slug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const ps = await posts()
  const p = await ps.findOne({ slug, status: "published" })
  if (!p) return { title: "Not found" }
  const title = p.seo?.metaTitle || p.title
  const description = p.seo?.metaDescription || p.summary
  const url = p.seo?.canonicalUrl || `${SITE_ORIGIN}/blog/${p.slug}`
  const image = p.seo?.ogImage || p.coverImage
  return {
    title: `${title} — Nandishwar Singh`,
    description,
    keywords: p.seo?.keywords?.length ? p.seo.keywords : p.tags,
    authors: [{ name: p.author }],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "Nandishwar Singh",
      publishedTime: p.publishedAt?.toString(),
      modifiedTime: p.updatedAt?.toString(),
      authors: [p.author],
      tags: p.tags,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function BlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<{ from?: string | string[] }>
}) {
  const { slug } = await params
  const { from } = await searchParams
  const fromHome = (Array.isArray(from) ? from[0] : from) === "home"
  const backHref = fromHome ? "/" : "/blog"
  const backLabel = fromHome ? "Back to home" : "Back to all posts"
  const ps = await posts()
  const p = await ps.findOne({ slug, status: "published" })
  if (!p) notFound()

  // Fire-and-forget view counter — no need to await.
  void ps.updateOne({ slug }, { $inc: { views: 1 } }).catch(() => {})

  // Pull a small slice of comments alongside so we can include them in JSON-LD.
  const cm = await comments()
  const commentDocs = await cm
    .find(
      { postSlug: slug, deleted: false, depth: 0 },
      { projection: { body: 1, authorName: 1, createdAt: 1 } }
    )
    .sort({ createdAt: 1 })
    .limit(20)
    .toArray()

  const relatedPosts: Post[] = p.tags?.length
    ? await ps
        .find(
          {
            status: "published",
            slug: { $ne: slug },
            tags: { $in: p.tags },
          },
          { projection: { body: 0 } }
        )
        .sort({ publishedAt: -1 })
        .limit(4)
        .toArray()
    : []

  const url = p.seo?.canonicalUrl || `${SITE_ORIGIN}/blog/${p.slug}`
  const image = p.seo?.ogImage || p.coverImage
  const readMin = readingTimeMinutes(p.body)

  const articleLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: p.title,
    description: p.summary,
    datePublished: p.publishedAt?.toString(),
    dateModified: p.updatedAt?.toString(),
    author: { "@id": PERSON.id },
    publisher: { "@id": PERSON.id },
    isPartOf: { "@id": WEBSITE.id },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    inLanguage: "en",
    keywords: (p.seo?.keywords?.length ? p.seo.keywords : p.tags).join(", "),
    articleSection: p.tags?.[0],
    wordCount: p.body.split(/\s+/).filter(Boolean).length,
    timeRequired: `PT${readMin}M`,
  }
  if (image) articleLd.image = image
  if (p.tags?.length) articleLd.about = p.tags.map((t) => ({
    "@type": "Thing",
    name: t,
  }))
  if (commentDocs.length > 0) {
    articleLd.commentCount = commentDocs.length
    articleLd.comment = commentDocs.map((c) => ({
      "@type": "Comment",
      text: c.body,
      author: { "@type": "Person", name: c.authorName },
      dateCreated: c.createdAt.toISOString(),
    }))
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
      { "@type": "ListItem", position: 3, name: p.title, item: url },
    ],
  }

  const relatedLd =
    relatedPosts.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Related posts",
          itemListElement: relatedPosts.map((rp, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_ORIGIN}/blog/${rp.slug}`,
            name: rp.title,
          })),
        }
      : null

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10 lg:px-6 lg:py-14">
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />
      {relatedLd && <JsonLd data={relatedLd} />}

      <nav className="flex items-center gap-3 text-xs text-muted-foreground">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {backLabel}
        </Link>
      </nav>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3" />
            {p.publishedAt
              ? new Date(p.publishedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {readMin} min read
          </span>
          {p.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px]"
            >
              {t}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {p.title}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {p.summary}
        </p>
      </header>

      <aside
        className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-relaxed text-foreground/90"
        aria-label="TL;DR"
      >
        <span className="mr-2 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
          TL;DR
        </span>
        {p.summary}
      </aside>

      {p.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.coverImage}
          alt={p.title}
          className="w-full rounded-lg border border-border/40 object-cover"
        />
      )}

      <PostMarkdown content={p.body} />

      {relatedPosts.length > 0 && (
        <>
          <hr className="border-border/40" />
          <section
            aria-labelledby="related-heading"
            className="flex flex-col gap-3"
          >
            <h2
              id="related-heading"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Related posts
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {relatedPosts.map((rp) => (
                <li key={rp.slug}>
                  <Link
                    href={`/blog/${rp.slug}`}
                    className="group flex flex-col gap-1.5 rounded-md border border-border/40 bg-background/40 p-3 transition-colors hover:bg-card/80"
                  >
                    <span className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-foreground">
                      {rp.title}
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {rp.summary}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
                      Read
                      <ArrowUpRight className="size-3" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <hr className="border-border/40" />

      <CommentSection postSlug={p.slug} />

      <hr className="border-border/40" />

      <footer className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Written by{" "}
          <span className="text-foreground">{p.author}</span>
        </span>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {backLabel}
        </Link>
      </footer>
    </main>
  )
}
