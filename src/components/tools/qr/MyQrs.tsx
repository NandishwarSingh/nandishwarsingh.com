"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowUpRight,
  KeyRound,
  MousePointerClick,
  QrCode as QrCodeIcon,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AdoptQrDialog } from "./AdoptQrDialog"
import { ConfirmDialog } from "./ConfirmDialog"
import { listOwned, QR_STORE_EVENT, removeOwnerKey } from "./storage"

type Row = {
  slug: string
  title: string
  createdAt: string
  ownerKey: string
  loading: boolean
  totalCount?: number
  uniqueCount?: number
  shortUrl?: string
  targetUrl?: string
  notFound?: boolean
}

export function MyQrs() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [tick, setTick] = useState(0)
  const [confirming, setConfirming] = useState<Row | null>(null)
  const [adopting, setAdopting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const owned = listOwned()
    if (owned.length === 0) {
      setRows([])
      return
    }
    const initial: Row[] = owned.map((o) => ({
      slug: o.slug,
      title: o.title,
      createdAt: o.createdAt,
      ownerKey: o.ownerKey,
      loading: true,
    }))
    setRows(initial)
    // Fetch stats for each in parallel. Keep the localStorage entry even if
    // the server 404s — the user can clean up with Forget.
    Promise.all(
      initial.map(async (row) => {
        try {
          const res = await fetch(
            `/api/qr/${row.slug}?ownerKey=${encodeURIComponent(row.ownerKey)}`
          )
          if (res.status === 404) {
            return { ...row, loading: false, notFound: true }
          }
          if (!res.ok) return { ...row, loading: false }
          const body = await res.json()
          return {
            ...row,
            loading: false,
            totalCount: body.stats.totalCount,
            uniqueCount: body.stats.uniqueCount,
            shortUrl: body.link.shortUrl,
            targetUrl: body.link.targetUrl,
            title: body.link.title ?? row.title,
          }
        } catch {
          return { ...row, loading: false }
        }
      })
    ).then((next) => {
      if (!cancelled) setRows(next)
    })
    return () => {
      cancelled = true
    }
  }, [tick])

  useEffect(() => {
    const refresh = () => setTick((t) => t + 1)
    window.addEventListener(QR_STORE_EVENT, refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener(QR_STORE_EVENT, refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  function forget(slug: string) {
    removeOwnerKey(slug)
    setRows((r) => r?.filter((x) => x.slug !== slug) ?? [])
  }

  function askForget(row: Row) {
    if (row.notFound) {
      // Already gone on the server — no need to nag.
      forget(row.slug)
      return
    }
    setConfirming(row)
  }

  if (rows === null) return null

  if (rows.length === 0) {
    return (
      <>
        <Card className="flex flex-col items-center gap-3 border-dashed p-6 text-center">
          <QrCodeIcon className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium">No tracked QRs here yet</p>
          <p className="max-w-md text-xs text-muted-foreground">
            Create one above — it'll appear in this list. Owner keys are saved
            in your browser, so your QRs show up on this device only. Made one
            on another device?
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setAdopting(true)}
          >
            <KeyRound className="size-3.5" />
            Adopt with owner key
          </Button>
        </Card>
        <AdoptQrDialog open={adopting} onOpenChange={setAdopting} />
      </>
    )
  }

  return (
    <Card className="flex flex-col divide-y divide-border/40 overflow-hidden p-0">
      <header className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your QRs
          </h3>
          <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
            {rows.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setAdopting(true)}
            title="Have an owner key from another device? Adopt the QR here."
          >
            <KeyRound className="size-3.5" />
            Adopt
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Stored on this device
          </p>
        </div>
      </header>
      {rows.map((row) => (
        <Row key={row.slug} row={row} onForget={() => askForget(row)} />
      ))}

      <AdoptQrDialog open={adopting} onOpenChange={setAdopting} />

      <ConfirmDialog
        open={!!confirming}
        onOpenChange={(v) => !v && setConfirming(null)}
        destructive
        title={`Forget "${confirming?.title ?? ""}" on this device?`}
        description={
          <>
            <span className="block">
              The short URL{" "}
              <span className="font-mono text-foreground">
                {confirming?.shortUrl ?? `/r/${confirming?.slug ?? ""}`}
              </span>{" "}
              keeps working — it just disappears from this list and you'll lose
              the ability to edit or delete it from this browser.
            </span>
            <span className="mt-2 block">
              Save the owner key first if you want to manage it again later.
            </span>
          </>
        }
        confirmLabel="Forget here"
        onConfirm={() => {
          if (confirming) forget(confirming.slug)
        }}
      />
    </Card>
  )
}

function Row({ row, onForget }: { row: Row; onForget: () => void }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{row.title}</span>
          {row.notFound && (
            <span className="shrink-0 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">
              Deleted on server
            </span>
          )}
        </div>
        <span className="truncate font-mono text-[11px] text-muted-foreground">
          {row.shortUrl ?? `/r/${row.slug}`}
        </span>
      </div>

      <div className="hidden items-center gap-4 text-xs sm:flex">
        <Stat
          icon={<MousePointerClick className="size-3.5" />}
          value={row.loading ? "…" : row.notFound ? "—" : row.totalCount ?? 0}
          label="clicks"
        />
        <Stat
          value={row.loading ? "…" : row.notFound ? "—" : row.uniqueCount ?? 0}
          label="unique"
        />
      </div>

      {row.notFound ? (
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          onClick={onForget}
        >
          <X className="size-3.5" />
          Forget
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
            <Link href={`/tools/qr/${row.slug}`}>
              Open
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onForget}
            title="Forget on this device (doesn't delete the QR)"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

function Stat({
  icon,
  value,
  label,
}: {
  icon?: React.ReactNode
  value: string | number
  label: string
}) {
  return (
    <div className="flex flex-col items-end gap-0 leading-tight">
      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
        {icon}
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
}
