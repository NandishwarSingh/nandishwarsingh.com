import Link from "next/link"
import { ArrowUpRight, BookOpen, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { posts } from "@/lib/db"
import { readingTimeMinutes } from "@/lib/posts"

type Variant = "grid" | "stack"

export async function MyBlogsSection({
  variant = "grid",
  limit = 3,
}: {
  variant?: Variant
  limit?: number
} = {}) {
  const ps = await posts()
  const list = await ps
    .find(
      { status: "published" },
      {
        projection: {
          body: 1,
          title: 1,
          slug: 1,
          summary: 1,
          coverImage: 1,
          tags: 1,
          publishedAt: 1,
        },
      }
    )
    .sort({ publishedAt: -1 })
    .limit(limit)
    .toArray()

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">Latest posts</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Long-form notes on building this site, side-projects, and the engineering behind them.
          </p>
        </div>
        <Link
          href="/blog"
          className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          All posts →
        </Link>
      </header>

      {list.length === 0 ? (
        <Card className="flex items-center justify-center p-10 text-sm text-muted-foreground">
          No posts published yet — check back soon.
        </Card>
      ) : (
        <div
          className={
            variant === "stack"
              ? "flex flex-col gap-3"
              : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {list.map((p) => {
            const minutes = readingTimeMinutes(p.body ?? "")
            return (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="group">
                <Card
                  className={
                    variant === "stack"
                      ? "flex flex-col gap-3 overflow-hidden p-0 transition-colors hover:bg-card/80 sm:flex-row"
                      : "flex h-full flex-col overflow-hidden p-0 transition-colors hover:bg-card/80"
                  }
                >
                  {p.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverImage}
                      alt={`${p.title} — cover image`}
                      loading="lazy"
                      decoding="async"
                      className={
                        variant === "stack"
                          ? "aspect-video w-full shrink-0 object-cover sm:aspect-square sm:w-44"
                          : "aspect-video w-full object-cover"
                      }
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Calendar className="size-3" />
                      <span>
                        {p.publishedAt
                          ? new Date(p.publishedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>
                      <span>·</span>
                      <span>{minutes} min</span>
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight transition-colors group-hover:text-foreground">
                      {p.title}
                    </h3>
                    <p className="line-clamp-3 text-xs text-muted-foreground">
                      {p.summary}
                    </p>
                    <div className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                      Read post
                      <ArrowUpRight className="size-3.5" />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
