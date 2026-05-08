"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileImage,
  FileText,
  Link2,
  Loader2,
  Pencil,
  QrCode as QrCodeIcon,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEFAULT_STYLE, type QrStyle } from "@/lib/qr-style"
import { QrPreview, type QrPreviewHandle } from "./QrPreview"
import {
  ClicksTimeseries,
  CountryBar,
  DeviceDonut,
} from "./QrAnalyticsCharts"
import { ConfirmDialog } from "./ConfirmDialog"
import { getOwnerKey, removeOwnerKey } from "./storage"

type Stats = {
  totalCount: number
  uniqueCount: number
  timeseries: { day: string; clicks: number }[]
  countries: { country: string; clicks: number }[]
  devices: { device: string; clicks: number }[]
  browsers: { browser: string; clicks: number }[]
  recent: Array<{
    slug: string
    ts: string
    country?: string
    region?: string
    city?: string
    ua: string
    device?: string
    os?: string
    browser?: string
    isUnique: boolean
  }>
}

type Payload = {
  link: {
    slug: string
    title: string
    targetUrl: string
    shortUrl: string
    style: QrStyle
    createdAt: string
    updatedAt: string
  }
  isOwner: boolean
  stats: Stats
}

export function QrDashboard({ slug }: { slug: string }) {
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editTarget, setEditTarget] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [exporting, setExporting] = useState(false)
  const previewRef = useRef<QrPreviewHandle | null>(null)

  const fetchStats = useCallback(async () => {
    setError(null)
    const ownerKey = getOwnerKey(slug)
    const qs = ownerKey ? `?ownerKey=${encodeURIComponent(ownerKey)}` : ""
    try {
      const res = await fetch(`/api/qr/${slug}${qs}`)
      const body = await res.json()
      if (!res.ok) {
        setError(body?.error ?? `Failed (${res.status})`)
        setLoading(false)
        return
      }
      setData(body)
      setEditTitle(body.link.title)
      setEditTarget(body.link.targetUrl)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  async function handleCopy() {
    if (!data) return
    await navigator.clipboard.writeText(data.link.shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  async function handleSaveEdit() {
    const ownerKey = getOwnerKey(slug)
    if (!ownerKey || !data) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/qr/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Owner-Key": ownerKey,
        },
        body: JSON.stringify({
          title: editTitle.trim() || data.link.title,
          targetUrl: editTarget.trim() || data.link.targetUrl,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error ?? "Failed to save changes")
      } else {
        setEditing(false)
        await fetchStats()
      }
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleExport(extension: "png" | "svg") {
    if (!previewRef.current || exporting) return
    setExporting(true)
    try {
      await previewRef.current.download(extension)
    } finally {
      setExporting(false)
    }
  }

  async function handleExportPdf() {
    if (!previewRef.current || exporting) return
    setExporting(true)
    try {
      const blob = await previewRef.current.getRawData("png")
      if (!blob) return
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = reject
        r.readAsDataURL(blob)
      })
      const { jsPDF } = await import("jspdf")
      const pdf = new jsPDF({ unit: "pt", format: "a4" })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const size = Math.min(pageWidth, pageHeight) - 96
      const x = (pageWidth - size) / 2
      const y = (pageHeight - size) / 2
      pdf.addImage(dataUrl, "PNG", x, y, size, size, undefined, "FAST")
      const captionText =
        (data?.link.style?.caption as { text?: string } | undefined)?.text ??
        data?.link.title
      if (captionText) {
        pdf.setFontSize(14)
        pdf.text(captionText, pageWidth / 2, y + size + 28, {
          align: "center",
        })
      }
      pdf.save(`${data?.link.slug ?? "qr"}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    const ownerKey = getOwnerKey(slug)
    if (!ownerKey) return
    const res = await fetch(`/api/qr/${slug}`, {
      method: "DELETE",
      headers: { "X-Owner-Key": ownerKey },
    })
    if (res.ok) {
      removeOwnerKey(slug)
      window.location.href = "/tools/qr"
    }
  }

  if (loading) {
    return (
      <Card className="flex items-center justify-center p-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <AlertCircle className="size-6 text-destructive" />
        <p className="text-sm text-destructive">{error ?? "Not found"}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/tools/qr">
            <ArrowLeft className="size-4" />
            Back to QR Studio
          </Link>
        </Button>
      </Card>
    )
  }

  const { link, stats, isOwner } = data
  const style = { ...DEFAULT_STYLE, ...link.style } as QrStyle

  const last7 = stats.timeseries.slice(-7).reduce((s, p) => s + p.clicks, 0)
  const topCountry = stats.countries[0]

  return (
    <section className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex w-full max-w-[200px] shrink-0 flex-col gap-2 sm:w-48">
            <QrPreview
              ref={previewRef}
              data={link.shortUrl}
              style={style}
              maxDisplayPx={180}
              filename={link.slug}
            />
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExport("png")}
                disabled={exporting}
                className="h-7 gap-1 text-[11px]"
                title="Download PNG"
              >
                {exporting ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <FileImage className="size-3" />
                )}
                PNG
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExport("svg")}
                disabled={exporting}
                className="h-7 gap-1 text-[11px]"
                title="Download SVG"
              >
                <Download className="size-3" />
                SVG
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                disabled={exporting}
                className="h-7 gap-1 text-[11px]"
                title="Download PDF"
              >
                <FileText className="size-3" />
                PDF
              </Button>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {editing ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                      className="h-9"
                    />
                    <Input
                      type="url"
                      value={editTarget}
                      onChange={(e) => setEditTarget(e.target.value)}
                      placeholder="https://…"
                      className="h-9"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={savingEdit}
                        className="h-8 text-xs"
                      >
                        {savingEdit ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(false)}
                        className="h-8 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="truncate text-xl font-semibold tracking-tight">
                      {link.title}
                    </h1>
                    <a
                      href={link.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-xs text-muted-foreground hover:text-foreground"
                    >
                      {link.targetUrl}
                    </a>
                  </>
                )}
              </div>
              {isOwner && !editing && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => setEditing(true)}
                    aria-label="Edit"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-2 py-1.5">
              <Link2 className="size-3.5 text-muted-foreground" />
              <code className="flex-1 truncate font-mono text-xs">
                {link.shortUrl}
              </code>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={handleCopy}
                aria-label="Copy"
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>

            {!isOwner && (
              <p className="text-[11px] text-amber-300">
                You're viewing someone else's QR. Stats are public, but
                editing requires the owner key.
              </p>
            )}
          </div>
        </div>

        <Separator className="opacity-60" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Total clicks" value={stats.totalCount} />
          <Kpi label="Unique visitors" value={stats.uniqueCount} />
          <Kpi label="Last 7 days" value={last7} />
          <Kpi
            label="Top country"
            value={topCountry ? `${topCountry.country}` : "—"}
            sub={topCountry ? `${topCountry.clicks} clicks` : undefined}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <ChartHeader
            title="Clicks over time"
            action={
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => fetchStats()}
              >
                <RefreshCw className="size-3" />
                Refresh
              </Button>
            }
          />
          {stats.timeseries.length === 0 ? (
            <EmptyState>Waiting for the first scan…</EmptyState>
          ) : (
            <ClicksTimeseries data={stats.timeseries} />
          )}
        </Card>
        <Card className="p-4">
          <ChartHeader title="Devices" />
          <DeviceDonut data={stats.devices} />
          <LegendList items={stats.devices.map((d) => ({ label: d.device, value: d.clicks }))} />
        </Card>
        <Card className="p-4">
          <ChartHeader title="Countries" />
          <CountryBar data={stats.countries} />
        </Card>
        <Card className="p-4">
          <ChartHeader title="Browsers" />
          <LegendList items={stats.browsers.map((b) => ({ label: b.browser, value: b.clicks }))} />
        </Card>
      </div>

      <Card className="p-4">
        <ChartHeader
          title="Recent clicks"
          action={
            <span className="text-[11px] text-muted-foreground">
              Showing last {stats.recent.length}
            </span>
          }
        />
        {stats.recent.length === 0 ? (
          <EmptyState>No clicks yet. Share the short URL to start.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground">
                  <th className="py-2 pr-3 text-left font-medium">When</th>
                  <th className="py-2 pr-3 text-left font-medium">Where</th>
                  <th className="py-2 pr-3 text-left font-medium">Device</th>
                  <th className="py-2 pr-3 text-left font-medium">Browser</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((c, i) => (
                  <tr key={i} className="border-b border-border/20 last:border-0">
                    <td className="py-2 pr-3 font-mono text-muted-foreground">
                      {new Date(c.ts).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3">
                      {c.country ? (
                        <span>
                          {c.country}
                          {c.city && (
                            <span className="text-muted-foreground"> · {c.city}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 capitalize">
                      {c.device ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2 pr-3">
                      {c.browser ?? <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex justify-between pt-2 text-xs text-muted-foreground">
        <Link
          href="/tools/qr"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to QR Studio
        </Link>
        <span className="inline-flex items-center gap-1.5">
          <QrCodeIcon className="size-3.5" />
          Created {new Date(link.createdAt).toLocaleDateString()}
        </span>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        destructive
        title="Delete this tracked QR?"
        description={
          <>
            <span className="block">
              <span className="font-mono text-foreground">{link.shortUrl}</span>{" "}
              will stop resolving immediately. Anyone scanning the printed QR
              afterwards will see a 404.
            </span>
            <span className="mt-2 block">
              Click history is preserved on the server but no longer visible.
            </span>
          </>
        }
        confirmLabel="Delete forever"
        onConfirm={handleDelete}
      />
    </section>
  )
}

function Kpi({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border/40 bg-background/30 p-3">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-2xl font-semibold tracking-tight">{value}</span>
      {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
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

function LegendList({
  items,
}: {
  items: Array<{ label: string; value: number }>
}) {
  const total = items.reduce((s, i) => s + i.value, 0)
  if (items.length === 0) {
    return <EmptyState>No data yet</EmptyState>
  }
  return (
    <ul className="mt-3 flex flex-col gap-1.5 text-xs">
      {items.map((it) => (
        <li key={it.label} className="flex items-center justify-between gap-3">
          <span className="truncate text-muted-foreground">{it.label}</span>
          <span className="font-mono">
            {it.value}
            {total > 0 && (
              <span className="ml-1 text-muted-foreground">
                ({Math.round((it.value / total) * 100)}%)
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[120px] items-center justify-center text-center text-xs text-muted-foreground">
      {children}
    </div>
  )
}

