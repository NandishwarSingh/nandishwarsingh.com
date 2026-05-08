import Link from "next/link"
import { ArrowUpRight, BarChart3, Bot, FileText, Pencil } from "lucide-react"
import { Card } from "@/components/ui/card"
import { posts } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function AdminHomePage() {
  const ps = await posts()
  const [draftCount, publishedCount, latest] = await Promise.all([
    ps.countDocuments({ status: "draft" }),
    ps.countDocuments({ status: "published" }),
    ps
      .find({}, { projection: { body: 0 } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray(),
  ])

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, Nandishwar
        </h1>
        <p className="text-xs text-muted-foreground">
          Quick admin landing — write a blog, peek at site traffic, manage published posts.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/blogs/new" className="group">
          <Card className="flex h-full flex-col gap-2 p-5 transition-colors hover:bg-card/80">
            <Pencil className="size-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Write a new blog</h2>
            <p className="text-xs text-muted-foreground">
              Markdown editor, image + video support, full SEO + GEO controls.
            </p>
            <span className="mt-auto inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
              Open editor
              <ArrowUpRight className="size-3.5" />
            </span>
          </Card>
        </Link>
        <Link href="/admin/blogs" className="group">
          <Card className="flex h-full flex-col gap-2 p-5 transition-colors hover:bg-card/80">
            <FileText className="size-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold">All posts</h2>
            <p className="text-xs text-muted-foreground">
              {publishedCount} published · {draftCount} draft{draftCount === 1 ? "" : "s"}
            </p>
            <span className="mt-auto inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
              Manage
              <ArrowUpRight className="size-3.5" />
            </span>
          </Card>
        </Link>
        <Link href="/admin/autoblog" className="group">
          <Card className="flex h-full flex-col gap-2 p-5 transition-colors hover:bg-card/80">
            <Bot className="size-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Auto-blog</h2>
            <p className="text-xs text-muted-foreground">
              Sonar → Gemini → Claude pipeline that writes a fresh post every 6 hours.
            </p>
            <span className="mt-auto inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
              Run + history
              <ArrowUpRight className="size-3.5" />
            </span>
          </Card>
        </Link>
        <Link href="/stats" className="group">
          <Card className="flex h-full flex-col gap-2 p-5 transition-colors hover:bg-card/80">
            <BarChart3 className="size-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Live traffic</h2>
            <p className="text-xs text-muted-foreground">
              Public stats page — shareable URL, real-time visitors.
            </p>
            <span className="mt-auto inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
              Open
              <ArrowUpRight className="size-3.5" />
            </span>
          </Card>
        </Link>
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Recent activity
        </h2>
        {latest.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No posts yet. Hit{" "}
            <Link href="/admin/blogs/new" className="text-foreground underline">
              Write a new blog
            </Link>{" "}
            to start.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/40">
            {latest.map((p) => (
              <li
                key={p.slug}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <Link
                  href={`/admin/blogs/${p.slug}/edit`}
                  className="min-w-0 flex-1 truncate text-sm hover:text-foreground"
                >
                  {p.title}
                </Link>
                <span
                  className={
                    p.status === "published"
                      ? "shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300"
                      : "shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300"
                  }
                >
                  {p.status}
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  )
}
