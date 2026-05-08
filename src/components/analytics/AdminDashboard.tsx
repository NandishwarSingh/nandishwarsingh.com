"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Activity,
  AlertCircle,
  Eye,
  Globe,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TimerReset,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"

const RANGE_OPTIONS = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
] as const

type Range = (typeof RANGE_OPTIONS)[number]["value"]

type Stats = {
  range: Range
  includeBots: boolean
  summary: {
    views: number
    sessions: number
    bouncedSessions: number
    bounceRate: number
    avgDurationMs: number
    avgPagesPerSession: number
    activeNow: number
    botsFiltered: number
  }
  timeseries: Array<{ bucket: string; views: number; sessions: number }>
  countries: Array<{ country: string; views: number; sessions: number }>
  paths: Array<{
    path: string
    views: number
    sessions: number
    avgDurationMs: number
  }>
  devices: Array<{ device: string; views: number }>
  osBreakdown: Array<{ os: string; views: number }>
  browsers: Array<{ browser: string; views: number }>
  recent: Array<{
    sessionId: string
    path: string
    ts: string
    durationMs: number
    country?: string
    city?: string
    ua: string
    device?: string
    os?: string
    browser?: string
    isBot: boolean
    botReason?: string
  }>
}

const DEVICE_COLORS = ["#7A9FD8", "#CADCFC", "#E7B2C9", "#F2C67A", "#C8A6F2"]

export function AdminDashboard() {
  const [range, setRange] = useState<Range>("7d")
  const [includeBots, setIncludeBots] = useState(false)
  const [data, setData] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/stats?range=${range}${includeBots ? "&bots=1" : ""}`,
          { cache: "no-store" }
        )
        const body = await res.json()
        if (!res.ok) {
          setError(body?.error ?? `Failed (${res.status})`)
          return
        }
        setData(body)
        setRefreshedAt(new Date())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error")
      } finally {
        setLoading(false)
      }
    },
    [range, includeBots]
  )

  useEffect(() => {
    void load()
  }, [load])

  // Auto-refresh every 30s when the range is short.
  useEffect(() => {
    if (range !== "24h" && range !== "7d") return
    const id = window.setInterval(() => void load(true), 30_000)
    return () => window.clearInterval(id)
  }, [range, load])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-6 px-4 py-6 lg:px-6 lg:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Live stats</h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              <Globe className="size-3" />
              Public
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Real traffic to nandishwarsingh.com — visitors, country mix, per-tool usage, time on site, bounce rate. Refreshed live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RangePicker value={range} onChange={setRange} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs",
              includeBots && "bg-amber-500/10 text-amber-200"
            )}
            onClick={() => setIncludeBots((b) => !b)}
            title="Include filtered bot traffic in the numbers"
          >
            <ShieldAlert className="size-3.5" />
            {includeBots ? "Bots: shown" : "Bots: hidden"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw
              className={cn("size-3.5", loading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </header>

      {error && (
        <Card className="flex items-center gap-2 p-4 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {error}
        </Card>
      )}

      {loading && !data ? (
        <Card className="flex items-center justify-center p-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </Card>
      ) : data ? (
        <>
          <KpiRow data={data} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="p-4 lg:col-span-2">
              <ChartHeader
                title={
                  range === "24h" ? "Views by hour" : "Views by day"
                }
                action={
                  refreshedAt && (
                    <span className="text-[11px] text-muted-foreground">
                      Updated {refreshedAt.toLocaleTimeString()}
                    </span>
                  )
                }
              />
              <ViewsChart data={data.timeseries} />
            </Card>

            <Card className="p-4">
              <ChartHeader title="Devices" />
              <DevicesDonut data={data.devices} />
            </Card>

            <Card className="p-4 lg:col-span-2">
              <ChartHeader title="Top tools & pages" />
              <PathsTable paths={data.paths} />
            </Card>

            <Card className="p-4">
              <ChartHeader title="Countries" />
              <CountriesList items={data.countries} />
            </Card>

            <Card className="p-4">
              <ChartHeader title="Browsers" />
              <SimpleBars items={data.browsers.map((b) => ({ label: b.browser, value: b.views }))} />
            </Card>

            <Card className="p-4">
              <ChartHeader title="Operating systems" />
              <SimpleBars items={data.osBreakdown.map((o) => ({ label: o.os, value: o.views }))} />
            </Card>
          </div>

          <Card className="p-4">
            <ChartHeader
              title="Recent activity"
              action={
                <span className="text-[11px] text-muted-foreground">
                  Showing last {data.recent.length}
                </span>
              }
            />
            <RecentTable rows={data.recent} />
          </Card>
        </>
      ) : null}
    </main>
  )
}

function RangePicker({
  value,
  onChange,
}: {
  value: Range
  onChange: (v: Range) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background/60 p-0.5">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs transition-colors",
            value === opt.value
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Kpi({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: string
}) {
  return (
    <Card className="flex flex-col gap-1.5 p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </Card>
  )
}

function KpiRow({ data }: { data: Stats }) {
  const { summary } = data
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Kpi
        icon={<Eye className="size-3.5" />}
        label="Views"
        value={summary.views.toLocaleString()}
        sub={`${summary.sessions.toLocaleString()} sessions · ${summary.avgPagesPerSession.toFixed(1)} pages/session`}
      />
      <Kpi
        icon={<Users className="size-3.5" />}
        label="Active now"
        value={summary.activeNow}
        sub="last 5 min"
      />
      <Kpi
        icon={<TimerReset className="size-3.5" />}
        label="Avg session"
        value={formatDuration(summary.avgDurationMs)}
        sub="time on site"
      />
      <Kpi
        icon={<Activity className="size-3.5" />}
        label="Bounce rate"
        value={`${(summary.bounceRate * 100).toFixed(1)}%`}
        sub={`${summary.bouncedSessions.toLocaleString()} single-page sessions`}
      />
      <Kpi
        icon={<ShieldAlert className="size-3.5" />}
        label="Bots filtered"
        value={summary.botsFiltered.toLocaleString()}
        sub={data.includeBots ? "included above" : "excluded above"}
      />
    </div>
  )
}

function ChartHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {action}
    </div>
  )
}

function ViewsChart({
  data,
}: {
  data: Array<{ bucket: string; views: number; sessions: number }>
}) {
  if (data.length === 0) {
    return <Empty>No traffic in this range yet.</Empty>
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="bucket"
          stroke="#a1a1aa"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tickFormatter={(v) => {
            const s = v as string
            return s.length > 10 ? s.slice(11, 16) : s.slice(5)
          }}
        />
        <YAxis
          stroke="#a1a1aa"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.2)" }}
          contentStyle={{
            background: "rgba(10,10,10,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#fafafa" }}
        />
        <Line
          type="monotone"
          dataKey="views"
          name="Views"
          stroke="#CADCFC"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="sessions"
          name="Sessions"
          stroke="#7A9FD8"
          strokeWidth={2}
          strokeDasharray="3 3"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function DevicesDonut({ data }: { data: Array<{ device: string; views: number }> }) {
  if (data.length === 0) return <Empty>No data</Empty>
  return (
    <>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Tooltip
            contentStyle={{
              background: "rgba(10,10,10,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Pie
            data={data}
            dataKey="views"
            nameKey="device"
            innerRadius={48}
            outerRadius={78}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <SimpleBars
        items={data.map((d) => ({ label: d.device, value: d.views }))}
      />
    </>
  )
}

function PathsTable({
  paths,
}: {
  paths: Stats["paths"]
}) {
  if (paths.length === 0) {
    return <Empty>No traffic in this range yet.</Empty>
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-border/40 text-muted-foreground">
            <th className="py-2 pr-3 text-left font-medium">Path</th>
            <th className="py-2 pr-3 text-right font-medium">Views</th>
            <th className="py-2 pr-3 text-right font-medium">Sessions</th>
            <th className="py-2 pr-3 text-right font-medium">Avg time</th>
          </tr>
        </thead>
        <tbody>
          {paths.map((p) => (
            <tr key={p.path} className="border-b border-border/20 last:border-0">
              <td className="py-2 pr-3 font-mono text-foreground">{p.path}</td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {p.views.toLocaleString()}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                {p.sessions.toLocaleString()}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                {formatDuration(p.avgDurationMs)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CountriesList({
  items,
}: {
  items: Array<{ country: string; views: number; sessions: number }>
}) {
  if (items.length === 0) return <Empty>No data yet</Empty>
  const max = Math.max(...items.map((i) => i.views), 1)
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, items.length * 22)}>
      <BarChart
        data={items}
        layout="vertical"
        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
      >
        <XAxis
          type="number"
          stroke="#a1a1aa"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          domain={[0, max]}
        />
        <YAxis
          type="category"
          dataKey="country"
          stroke="#a1a1aa"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={50}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "rgba(10,10,10,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="views" fill="#7A9FD8" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function SimpleBars({
  items,
}: {
  items: Array<{ label: string; value: number }>
}) {
  if (items.length === 0) return null
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className="mt-3 flex flex-col gap-1.5 text-xs">
      {items.map((it) => (
        <li key={it.label} className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="truncate text-muted-foreground">{it.label}</span>
            <span className="font-mono tabular-nums">{it.value.toLocaleString()}</span>
          </div>
          <div className="h-1 rounded-full bg-border/40">
            <div
              className="h-1 rounded-full bg-foreground/70"
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function RecentTable({ rows }: { rows: Stats["recent"] }) {
  if (rows.length === 0) {
    return <Empty>No activity yet. Open the home page to record one.</Empty>
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-border/40 text-muted-foreground">
            <th className="py-2 pr-3 text-left font-medium">When</th>
            <th className="py-2 pr-3 text-left font-medium">Path</th>
            <th className="py-2 pr-3 text-left font-medium">Where</th>
            <th className="py-2 pr-3 text-left font-medium">Device</th>
            <th className="py-2 pr-3 text-left font-medium">Browser / OS</th>
            <th className="py-2 pr-3 text-right font-medium">Time</th>
            <th className="py-2 pr-3 text-left font-medium">Bot?</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/20 last:border-0">
              <td className="py-2 pr-3 font-mono text-muted-foreground">
                {new Date(r.ts).toLocaleString()}
              </td>
              <td className="py-2 pr-3 font-mono">{r.path}</td>
              <td className="py-2 pr-3">
                {r.country ? (
                  <span>
                    {r.country}
                    {r.city && (
                      <span className="text-muted-foreground"> · {r.city}</span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-2 pr-3 capitalize">
                {r.device ?? <span className="text-muted-foreground">—</span>}
              </td>
              <td className="py-2 pr-3 text-muted-foreground">
                {r.browser ?? "—"}
                {r.os ? ` · ${r.os}` : ""}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {formatDuration(r.durationMs)}
              </td>
              <td className="py-2 pr-3">
                {r.isBot ? (
                  <span
                    className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300"
                    title={r.botReason}
                  >
                    {r.botReason ?? "bot"}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[140px] items-center justify-center text-center text-xs text-muted-foreground">
      {children}
    </div>
  )
}

function formatDuration(ms: number): string {
  if (!ms || ms < 1000) return `${Math.max(0, Math.round(ms))}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = s / 60
  if (m < 60) return `${m.toFixed(1)}m`
  const h = m / 60
  return `${h.toFixed(1)}h`
}

