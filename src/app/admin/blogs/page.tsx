import Link from "next/link"
import { ArrowUpRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { posts } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function AdminBlogsPage() {
  const ps = await posts()
  const all = await ps
    .find({}, { projection: { body: 0 } })
    .sort({ updatedAt: -1 })
    .limit(200)
    .toArray()
  const drafts = all.filter((p) => p.status === "draft")
  const published = all.filter((p) => p.status === "published")

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Blogs</h1>
          <p className="text-xs text-muted-foreground">
            {published.length} published · {drafts.length} draft
            {drafts.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild className="h-9 gap-1.5">
          <Link href="/admin/blogs/new">
            <Plus className="size-4" />
            New blog
          </Link>
        </Button>
      </header>

      {published.length > 0 && (
        <Group title="Published" rows={published} />
      )}
      {drafts.length > 0 && <Group title="Drafts" rows={drafts} />}
      {all.length === 0 && (
        <Card className="flex flex-col items-center gap-3 border-dashed p-10 text-center">
          <p className="text-sm">No posts yet.</p>
          <Button asChild size="sm">
            <Link href="/admin/blogs/new">
              <Plus className="size-4" />
              Write your first
            </Link>
          </Button>
        </Card>
      )}
    </section>
  )
}

function Group({
  title,
  rows,
}: {
  title: string
  rows: Array<{
    slug: string
    title: string
    summary: string
    status: string
    updatedAt: Date | string
    publishedAt?: Date | string | null
    tags: string[]
  }>
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <Card className="divide-y divide-border/40 p-0">
        {rows.map((p) => (
          <div key={p.slug} className="flex items-start gap-4 p-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link
                href={`/admin/blogs/${p.slug}/edit`}
                className="text-sm font-medium hover:text-foreground"
              >
                {p.title}
              </Link>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {p.summary}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="font-mono text-[10px] text-muted-foreground">
                  /blog/{p.slug}
                </span>
                {p.tags.slice(0, 5).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-[11px] text-muted-foreground">
                {new Date(p.updatedAt).toLocaleDateString()}
              </span>
              {p.status === "published" && (
                <Link
                  href={`/blog/${p.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Live
                  <ArrowUpRight className="size-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
