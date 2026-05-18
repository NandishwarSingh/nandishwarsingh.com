"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "motion/react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { MotionFade } from "@/components/motion/MotionFade"
import { Zap, Activity, Database } from "lucide-react"

const PREFIXES = ["user", "event", "order", "metric", "session"] as const
type Prefix = (typeof PREFIXES)[number]

async function api(qs: string) {
  const r = await fetch(`/api/ndb?${qs}`, { cache: "no-store" })
  return r.json()
}

type BenchResult = {
  kind: string
  requests: number
  reads: number
  writes: number
  wall_ms: number
  engine: {
    avg_us: number
    ops_per_sec: number
    p50_us: number
    p95_us: number
    p99_us: number
    p999_us: number
  }
  e2e: { ops_per_sec: number; p50_us: number; p99_us: number }
}

/* ───────────────────────────── benchmark ────────────────────────────── */

function Benchmark() {
  const [workload, setWorkload] = useState<"bench" | "benchwrite" | "benchmix">(
    "bench"
  )
  const [n, setN] = useState(1000)
  const [running, setRunning] = useState(false)
  const [res, setRes] = useState<BenchResult | null>(null)
  const [history, setHistory] = useState<
    { label: string; avg: number; ops: number; p99: number }[]
  >([])

  const label =
    workload === "bench"
      ? "READ"
      : workload === "benchwrite"
        ? "WRITE"
        : "MIXED 80/20"

  async function run() {
    setRunning(true)
    setRes(null)
    try {
      const d = await api(`op=${workload}&n=${n}`)
      if (d.ok) {
        setRes(d.bench)
        setHistory((h) =>
          [
            {
              label: `${label} ×${d.bench.requests}`,
              avg: d.bench.engine.avg_us,
              ops: d.bench.engine.ops_per_sec,
              p99: d.bench.engine.p99_us,
            },
            ...h,
          ].slice(0, 6)
        )
      }
    } finally {
      setRunning(false)
    }
  }

  const chart = res
    ? [
        { k: "p50", v: res.engine.p50_us },
        { k: "p95", v: res.engine.p95_us },
        { k: "p99", v: res.engine.p99_us },
        { k: "p999", v: res.engine.p999_us },
      ]
    : []

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Pick a workload and size, hit run. Every request is a real op against
        the live C engine. The headline numbers are{" "}
        <span className="text-foreground">measured by nDB itself</span> (its
        own latency histogram) — not the browser/Node round-trip.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            Workload
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["bench", "Read"],
                ["benchwrite", "Write"],
                ["benchmix", "Mixed 80/20"],
              ] as const
            ).map(([w, t]) => (
              <Button
                key={w}
                size="sm"
                variant={workload === w ? "default" : "outline"}
                disabled={running}
                onClick={() => setWorkload(w)}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            Requests
          </div>
          <div className="flex flex-wrap gap-2">
            {[500, 1000, 2500, 5000].map((x) => (
              <Button
                key={x}
                size="sm"
                variant={n === x ? "default" : "outline"}
                disabled={running}
                onClick={() => setN(x)}
              >
                {x.toLocaleString()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Button className="mt-5 w-full" size="lg" onClick={run} disabled={running}>
        <Zap className="size-4" />
        {running
          ? `Running ${label} ×${n.toLocaleString()}…`
          : `Run ${label} benchmark ×${n.toLocaleString()}`}
      </Button>

      {res && (
        <MotionFade className="mt-5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
            nDB engine — measured by the engine itself
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["avg / op", `${res.engine.avg_us}µs`, true],
              ["throughput", `${res.engine.ops_per_sec.toLocaleString()}/s`, true],
              ["p99", `${res.engine.p99_us}µs`, false],
              ["p999", `${res.engine.p999_us}µs`, false],
            ].map(([k, v, hero]) => (
              <Card key={k as string} className="bg-card/60">
                <CardContent className="p-4">
                  <div className="text-[10px] uppercase text-muted-foreground">
                    {k}
                  </div>
                  <div
                    className={
                      hero
                        ? "mt-1 text-2xl font-bold tabular-nums text-emerald-400"
                        : "mt-1 text-xl font-semibold tabular-nums"
                    }
                  >
                    {v}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{label}</Badge>
            <span>{res.requests.toLocaleString()} real ops</span>
            {res.kind === "mixed" && (
              <span>
                · {res.reads.toLocaleString()} GET /{" "}
                {res.writes.toLocaleString()} PUT
              </span>
            )}
          </div>

          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chart}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              >
                <XAxis
                  dataKey="k"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  unit="µs"
                />
                <Tooltip
                  cursor={{ fill: "var(--color-accent)" }}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`${v} µs`, "engine latency"]}
                />
                <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                  {chart.map((d) => (
                    <Cell key={d.k} fill="oklch(0.7 0.18 152)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            avg/op is exact for this run (derived from nDB&apos;s cumulative
            count·avg delta); percentiles are nDB&apos;s own histogram. For
            transparency, the full path including HTTPS + Node + a fresh TCP
            socket per request was{" "}
            <span className="text-foreground">
              {res.e2e.ops_per_sec.toLocaleString()}/s, p99 {res.e2e.p99_us}µs
            </span>{" "}
            — that overhead is the web bridge, not the database.
          </p>
        </MotionFade>
      )}

      {history.length > 0 && (
        <div className="mt-6">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Recent runs (engine numbers)
          </div>
          <div className="mt-2 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">run</th>
                  <th className="px-3 py-2 text-right font-medium">avg µs</th>
                  <th className="px-3 py-2 text-right font-medium">ops/sec</th>
                  <th className="px-3 py-2 text-right font-medium">p99 µs</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-t border-border/60">
                    <td className="px-3 py-2 font-mono">{h.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {h.avg}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-400">
                      {h.ops.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {h.p99}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────── live data ─────────────────────────────── */

function DataTable() {
  const [prefix, setPrefix] = useState<Prefix>("user")
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<
    { key: string; value: Record<string, string>; rttUs: number }[]
  >([])
  const [loading, setLoading] = useState(false)
  const PER = 12

  const load = useCallback(async (pfx: Prefix, p: number) => {
    setLoading(true)
    try {
      const d = await api(`op=rows&prefix=${pfx}&n=${PER}&start=${p * PER + 1}`)
      if (d.ok) setRows(d.rows)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(prefix, page)
  }, [prefix, page, load])

  const cols = rows[0] ? Object.keys(rows[0].value) : []

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Each row is fetched live with a real GET against the running engine.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PREFIXES.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={prefix === p ? "default" : "outline"}
            onClick={() => {
              setPrefix(p)
              setPage(0)
            }}
          >
            {p}
          </Button>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-[12px]">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">key</th>
              {cols.map((c) => (
                <th key={c} className="px-3 py-2 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={cols.length + 1}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  reading from nDB…
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.key}
                  className="border-t border-border/60 hover:bg-accent/40"
                >
                  <td className="px-3 py-2 font-mono text-emerald-400">
                    {r.key}
                  </td>
                  {cols.map((c) => (
                    <td key={c} className="px-3 py-2 tabular-nums">
                      {r.value[c]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {prefix}:{page * PER + 1}–{page * PER + PER} of 10,000
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading || page >= 832}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── server metrics ─────────────────────────── */

function LiveMetrics() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    const poll = async () => {
      try {
        const d = await api("op=stats")
        if (d.ok) {
          setStats(d.stats)
          setPulse((p) => p + 1)
        }
      } catch {
        /* keep */
      }
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => clearInterval(t)
  }, [])

  const L = (k: string) =>
    (stats?.[k] as
      | {
          count: number
          avg_us: number
          p50_us: number
          p99_us: number
          p999_us: number
        }
      | undefined) || undefined
  const c = (stats?.counters as Record<string, number>) || {}

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <motion.span
          key={pulse}
          initial={{ scale: 1.6 }}
          animate={{ scale: 1 }}
          className="inline-block size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.7_0.18_152)]"
        />
        nDB&apos;s own counters &amp; latency histograms, polled every 5s
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Total PUTs", c.total_puts],
          ["Total GETs", c.total_gets],
          ["GET p99", L("get_latency")?.p99_us],
          ["PUT p99", L("put_latency")?.p99_us],
        ].map(([k, v]) => (
          <Card key={k as string} className="bg-card/60">
            <CardContent className="p-4">
              <div className="text-[10px] uppercase text-muted-foreground">
                {k}
              </div>
              <div className="mt-1 text-xl font-bold tabular-nums text-emerald-400">
                {v != null
                  ? `${Number(v).toLocaleString()}${String(k).includes("p99") ? "µs" : ""}`
                  : "—"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {(["get_latency", "put_latency"] as const).map((k) => {
        const l = L(k)
        if (!l) return null
        return (
          <Card key={k} className="mt-3 bg-card/60">
            <CardContent className="p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {k.replace("_", " ")}
              </div>
              <div className="mt-2 grid grid-cols-5 gap-2 text-center">
                {[
                  ["count", l.count.toLocaleString()],
                  ["avg", `${l.avg_us}µs`],
                  ["p50", `${l.p50_us}µs`],
                  ["p99", `${l.p99_us}µs`],
                  ["p999", `${l.p999_us}µs`],
                ].map(([a, b]) => (
                  <div key={a}>
                    <div className="text-[10px] uppercase text-muted-foreground">
                      {a}
                    </div>
                    <div className="text-sm font-semibold tabular-nums">
                      {b}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/* ─────────────────────── how it compares (factual) ──────────────────── */

const COMPARE: { db: string; klass: string; read: string; write: string }[] = [
  { db: "nDB (SYNC_NONE)", klass: "embedded LSM, C", read: "~1–16µs cache/memtable", write: "~1–8µs" },
  { db: "RocksDB / LevelDB", klass: "embedded LSM (its peers)", read: "~1–10µs cache · ~50–200µs disk", write: "~1–5µs memtable" },
  { db: "Redis", klass: "in-memory store", read: "sub-µs in-proc · ~0.1–1ms loopback", write: "similar" },
  { db: "SQLite (sync=OFF)", klass: "embedded SQL", read: "~1–10µs in-cache", write: "~µs OFF · ~ms FULL" },
  { db: "Postgres / MySQL", klass: "client-server RDBMS", read: "~0.1–1ms+ local", write: "~ms durable commit" },
]

function ComparePanel() {
  return (
    <Card className="mt-8 bg-card/40">
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold">
          How fast is this, honestly, vs other databases?
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Typical order-of-magnitude figures — all hardware- and
          workload-dependent. nDB&apos;s numbers are measured on a shared
          1-core VPS with a small, RAM-resident 50k-row dataset.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">engine</th>
                <th className="px-3 py-2 font-medium">class</th>
                <th className="px-3 py-2 font-medium">point read</th>
                <th className="px-3 py-2 font-medium">point write</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((r) => (
                <tr
                  key={r.db}
                  className={
                    r.db.startsWith("nDB")
                      ? "border-t border-border/60 bg-emerald-500/5"
                      : "border-t border-border/60"
                  }
                >
                  <td className="px-3 py-2 font-medium">{r.db}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.klass}</td>
                  <td className="px-3 py-2 tabular-nums">{r.read}</td>
                  <td className="px-3 py-2 tabular-nums">{r.write}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 space-y-2 text-[13px] leading-relaxed text-muted-foreground">
          <p>
            <span className="text-foreground">Where it&apos;s genuinely
            fast:</span>{" "}
            nDB&apos;s engine is in the same microsecond class as
            RocksDB/LevelDB for cache/memtable-resident data, and ~140k
            writes/sec on one shared core. For a from-scratch hand-written C
            LSM engine that is a real result, and structurally it beats any
            client-server RDBMS on raw point-KV latency (no SQL planner, no
            MVCC, no network framing beyond a 5-byte header).
          </p>
          <p>
            <span className="text-foreground">The asterisks:</span> it runs{" "}
            <code className="rounded bg-muted px-1">SYNC_NONE</code> (no
            fsync) — apples-to-apples with Redis-without-persistence or SQLite{" "}
            <code className="rounded bg-muted px-1">synchronous=OFF</code>, not
            a durable Postgres commit (turn on{" "}
            <code className="rounded bg-muted px-1">SYNC_PER_WRITE</code> and
            writes drop to single-digit % of this). It is single-node,
            single-process and feature-light: no transactions/MVCC, limited
            SQL, no replication, no concurrent-writer scaling, and none of the
            decade of adversarial-workload hardening RocksDB/Redis/Postgres
            have. At 100M keys under compaction pressure with concurrent
            writers, the mature engines pull ahead.
          </p>
          <p className="text-foreground">
            Bottom line: as fast as RocksDB/Redis for small cache-resident KV,
            faster than any SQL RDBMS at raw point lookups — it wins
            &quot;impressive µs-per-line-of-C&quot;, not &quot;production
            database&quot;. A genuinely fast engine and a strong systems
            project; not a drop-in replacement for a battle-tested datastore.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/* ──────────────────────────── container ──────────────────────────────── */

export function NdbShowcase() {
  return (
    <section>
      <MotionFade>
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <Database className="size-4" />
            Real running nDB — run the tests yourself
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            A live nDB process is serving 50,000 rows on this server.
            Benchmark headline numbers are measured by nDB&apos;s own latency
            histogram — the database&apos;s real speed, not the web round-trip.
          </p>
        </div>
      </MotionFade>

      <Tabs defaultValue="bench" className="mt-6">
        <TabsList>
          <TabsTrigger value="bench">
            <Zap className="mr-1 size-3.5" /> Benchmark
          </TabsTrigger>
          <TabsTrigger value="data">Live data</TabsTrigger>
          <TabsTrigger value="metrics">
            <Activity className="mr-1 size-3.5" /> Server metrics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="bench" className="mt-5">
          <Benchmark />
        </TabsContent>
        <TabsContent value="data" className="mt-5">
          <DataTable />
        </TabsContent>
        <TabsContent value="metrics" className="mt-5">
          <LiveMetrics />
        </TabsContent>
      </Tabs>

      <ComparePanel />
    </section>
  )
}
