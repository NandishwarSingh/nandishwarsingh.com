import Link from "next/link"
import { ArrowUpRight, Hourglass } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GithubIcon } from "@/components/icons/brand-icons"
import { cn } from "@/lib/utils"
import type { Tool } from "./tools"

export function ToolCard({ tool }: { tool: Tool }) {
  const { slug, name, tagline, description, icon: Icon, status, accent, comingReason, href: hrefOverride, external, repo } =
    tool
  const computed = `/tools/${slug}`
  const href = hrefOverride ?? computed
  const isExternal = (external ?? false) || /^https?:\/\//.test(href)
  const isShipped = status === "shipped"

  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col gap-3 overflow-hidden p-5 transition-all duration-300",
        "hover:border-foreground/20 hover:bg-card/70 hover:shadow-lg hover:-translate-y-0.5"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full opacity-15 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: accent }}
      />

      <header className="flex items-start justify-between gap-3">
        <div
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/60 transition-colors group-hover:border-foreground/20"
          style={{ color: accent }}
        >
          <Icon className="size-4" />
        </div>
        <StatusPill status={status} comingReason={comingReason} />
      </header>

      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold tracking-tight transition-colors group-hover:text-foreground">
          {name}
        </h3>
        <p className="text-xs text-muted-foreground">{tagline}</p>
      </div>

      <p className="line-clamp-3 text-xs leading-relaxed text-foreground/70">
        {description}
      </p>

      {repo ? (
        <Badge
          variant="outline"
          asChild
          className="relative z-20 w-fit gap-1.5 px-2 py-1 text-[11px] font-normal transition-colors hover:bg-background"
        >
          <a href={repo} target="_blank" rel="noopener noreferrer">
            <GithubIcon className="size-3" />
            <span>Source on GitHub</span>
          </a>
        </Badge>
      ) : null}

      <footer className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
        {isShipped ? (
          <>
            <span>Open tool</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </>
        ) : (
          <span>See on roadmap</span>
        )}
      </footer>

      {/* Click-trap layer — placed last so it stacks on top of the static content,
          but the Badge/repo link (z-20) still receives clicks. */}
      <Link
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        aria-label={name}
        className="absolute inset-0 z-10"
      />
    </Card>
  )
}

function StatusPill({
  status,
  comingReason,
}: {
  status: Tool["status"]
  comingReason?: string
}) {
  if (status === "shipped") {
    return null
  }
  if (status === "in-progress") {
    return (
      <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-300">
        <Hourglass className="size-3" />
        Building
      </Badge>
    )
  }
  return (
    <Badge variant="outline" title={comingReason} className="text-muted-foreground">
      Soon
    </Badge>
  )
}
