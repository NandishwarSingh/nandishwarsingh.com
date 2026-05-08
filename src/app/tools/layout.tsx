import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SideLeft } from "@/components/portfolio/side-left"
import { SideRight } from "@/components/portfolio/side-right"

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-6 px-4 py-6 lg:px-6 lg:py-8">
      <nav className="flex items-center justify-between text-xs text-muted-foreground">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-background/40 px-2.5 py-1 transition-colors hover:bg-background/70 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Home
        </Link>
        <Link
          href="/tools"
          className="rounded-md px-2 py-1 transition-colors hover:text-foreground"
        >
          All tools →
        </Link>
      </nav>

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        <SideLeft />
        <div className="min-w-0">{children}</div>
        <SideRight />
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-muted-foreground">
        <span>© {new Date().getFullYear()} Nandishwar Singh</span>
        <span className="flex items-center gap-3">
          <a
            href="/stats"
            className="transition-colors hover:text-foreground"
            title="Public live traffic for this site"
          >
            Live stats →
          </a>
          <span>Built with Next.js, ElevenLabs UI, and yt-dlp.</span>
        </span>
      </footer>
    </main>
  )
}
