import Link from "next/link"
import {
  BarChart3,
  Bot,
  ExternalLink,
  Home,
  Pencil,
  ShieldCheck,
} from "lucide-react"

export const metadata = {
  title: "Admin — Nandishwar Singh",
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col gap-6 px-4 py-6 lg:px-6 lg:py-8">
      <nav className="flex items-center justify-between rounded-md border border-border/50 bg-background/40 px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
            <ShieldCheck className="size-3" />
            Admin
          </span>
          <Link
            href="/admin"
            className="transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/blogs"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <Pencil className="size-3" />
            Blogs
          </Link>
          <Link
            href="/admin/autoblog"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <Bot className="size-3" />
            Auto-blog
          </Link>
          <Link
            href="/stats"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <BarChart3 className="size-3" />
            Live stats
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/blog"
            target="_blank"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            View blog
            <ExternalLink className="size-3" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <Home className="size-3" />
            Home
          </Link>
        </div>
      </nav>
      <div>{children}</div>
    </main>
  )
}
