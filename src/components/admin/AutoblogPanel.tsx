"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Code2,
  Loader2,
  Newspaper,
  Play,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Run = {
  id: string
  startedAt: string
  finishedAt?: string
  source: "news" | "github" | "unknown"
  topic?: string
  postSlug?: string
  status: "running" | "ok" | "skipped" | "error"
  skipReason?: string
  errorMessage?: string
  writer?: { model: string }
  recencyCheck?: { ok: boolean; reason: string }
  dedupCheck?: { duplicate: boolean; reason: string }
}

export function AutoblogPanel({ configured }: { configured: boolean }) {
  const [runs, setRuns] = useState<Run[] | null>(null)
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/autoblog/runs", { cache: "no-store" })
      const body = await res.json()
      if (Array.isArray(body?.runs)) setRuns(body.runs)
    } catch (err) {
      console.warn(err)
    }
  }, [])

  useEffect(() => {
    void loadRuns()
    const id = window.setInterval(loadRuns, 8000)
    return () => window.clearInterval(id)
  }, [loadRuns])

  async function triggerRun() {
    if (running) return
    setRunning(true)
    setError(null)
    setLastResult(null)
    try {
      const res = await fetch("/api/admin/autoblog/run", { method: "POST" })
      const body = (await res.json()) as
        | { ok: true; runId: string; postSlug: string }
        | { ok: false; runId: string; reason: string }
      if (body.ok) {
        setLastResult(`Posted: /blog/${body.postSlug}`)
      } else {
        setLastResult(`Skipped: ${body.reason}`)
      }
      await loadRuns()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setRunning(false)
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Auto-blog</h1>
        <p className="text-xs text-muted-foreground">
          Pipeline: Perplexity Sonar (news / GitHub fallback) → Gemini 3 Flash
          recency + dedup checks → writer model (Gemini 3 Flash by default,
          Opus / Sonnet via env) → Mongo. Cron triggers it every 6 hours on
          the VPS; this page lets you run it manually.
        </p>
      </header>

      {!configured && (
        <Card className="flex items-start gap-3 border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Not configured.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set{" "}
              <code className="rounded bg-background/60 px-1 py-0.5 font-mono">
                OPENROUTER_API_KEY
              </code>{" "}
              (and optionally{" "}
              <code className="rounded bg-background/60 px-1 py-0.5 font-mono">
                OPENROUTER_NEWS_MODEL
              </code>
              ,{" "}
              <code className="rounded bg-background/60 px-1 py-0.5 font-mono">
                OPENROUTER_VERIFIER_MODEL
              </code>
              ,{" "}
              <code className="rounded bg-background/60 px-1 py-0.5 font-mono">
                OPENROUTER_WRITER_MODEL
              </code>
              ,{" "}
              <code className="rounded bg-background/60 px-1 py-0.5 font-mono">
                AUTOBLOG_STATUS=published
              </code>
              ) and restart the server.
            </p>
          </div>
        </Card>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">Trigger a run now</p>
          <p className="text-[11px] text-muted-foreground">
            Walks through the full pipeline. Takes 30–90 seconds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastResult && !error && (
            <span className="text-xs text-muted-foreground">{lastResult}</span>
          )}
          {error && (
            <span className="inline-flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3.5" />
              {error}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            disabled={running}
            onClick={loadRuns}
          >
            <RefreshCw className={cn("size-3.5", running && "animate-spin")} />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5"
            disabled={running || !configured}
            onClick={triggerRun}
          >
            {running ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="size-3.5" />
                Run now
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col divide-y divide-border/40 overflow-hidden p-0">
        <header className="flex items-center justify-between px-4 py-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recent runs
          </h2>
          <span className="text-[11px] text-muted-foreground">
            {runs?.length ?? 0} shown
          </span>
        </header>
        {runs === null ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : runs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No runs yet. Hit <strong className="text-foreground">Run now</strong> to test the pipeline.
          </div>
        ) : (
          runs.map((r) => <RunRow key={r.id} run={r} />)
        )}
      </Card>
    </section>
  )
}

function RunRow({ run }: { run: Run }) {
  const elapsed =
    run.finishedAt && run.startedAt
      ? Math.max(0, new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime())
      : null
  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={run.status} />
        <span className="font-mono text-[11px] text-muted-foreground">
          {new Date(run.startedAt).toLocaleString()}
        </span>
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <SourcePill source={run.source} />
          <span className="truncate">{run.topic ?? "(no topic)"}</span>
        </div>
        {run.postSlug && (
          <Link
            href={`/blog/${run.postSlug}`}
            target="_blank"
            className="inline-flex w-fit items-center gap-1 text-xs text-emerald-300 hover:underline"
          >
            /blog/{run.postSlug}
            <ArrowUpRight className="size-3" />
          </Link>
        )}
        {run.recencyCheck && !run.recencyCheck.ok && (
          <p className="text-[11px] text-amber-300">
            Recency: {run.recencyCheck.reason}
          </p>
        )}
        {run.dedupCheck?.duplicate && (
          <p className="text-[11px] text-amber-300">
            Dedup: {run.dedupCheck.reason}
          </p>
        )}
        {run.errorMessage && (
          <p className="line-clamp-3 text-[11px] text-destructive">
            {run.errorMessage}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right text-[11px] text-muted-foreground">
        {run.skipReason && (
          <div className="font-mono">skip: {run.skipReason}</div>
        )}
        {elapsed !== null && (
          <div className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {elapsed > 1000 ? `${(elapsed / 1000).toFixed(1)}s` : `${elapsed}ms`}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Run["status"] }) {
  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
        <CheckCircle2 className="size-3" />
        ok
      </span>
    )
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
        <Loader2 className="size-3 animate-spin" />
        running
      </span>
    )
  }
  if (status === "skipped") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        skipped
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
      <AlertCircle className="size-3" />
      error
    </span>
  )
}

function SourcePill({ source }: { source: Run["source"] }) {
  if (source === "news") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
        <Newspaper className="size-3" />
        news
      </span>
    )
  }
  if (source === "github") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
        <Code2 className="size-3" />
        github
      </span>
    )
  }
  return null
}
