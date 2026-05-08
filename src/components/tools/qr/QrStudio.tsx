"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileImage,
  FileText,
  Link2,
  Loader2,
  QrCode as QrCodeIcon,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ShimmeringText } from "@/components/ui/shimmering-text"
import { DEFAULT_STYLE, type QrStyle } from "@/lib/qr-style"
import { cn } from "@/lib/utils"
import { QrCustomizer } from "./QrCustomizer"
import { QrPreview, type QrPreviewHandle } from "./QrPreview"
import { saveOwnerKey } from "./storage"

type Created = {
  slug: string
  shortUrl: string
  ownerKey: string
}

type State =
  | { kind: "idle" }
  | { kind: "creating" }
  | { kind: "error"; message: string }

export function QrStudio() {
  const [targetUrl, setTargetUrl] = useState("")
  const [title, setTitle] = useState("")
  const [style, setStyle] = useState<QrStyle>(DEFAULT_STYLE)
  const [state, setState] = useState<State>({ kind: "idle" })
  const [created, setCreated] = useState<Created | null>(null)
  const [copied, setCopied] = useState<null | "short" | "owner">(null)

  const previewRef = useRef<QrPreviewHandle | null>(null)

  const previewData = created?.shortUrl || targetUrl.trim() || "https://nandishwarsingh.com"
  const isCreating = state.kind === "creating"

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (isCreating) return
    const url = targetUrl.trim()
    if (!url) return
    setState({ kind: "creating" })
    try {
      const res = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: url,
          title: title.trim() || "Untitled QR",
          style,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setState({ kind: "error", message: body?.error ?? `Failed (${res.status})` })
        return
      }
      const payload = body as Created
      saveOwnerKey(payload.slug, payload.ownerKey, title.trim() || "Untitled QR")
      setCreated(payload)
      setState({ kind: "idle" })
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      })
    }
  }

  async function handleExportPng() {
    await previewRef.current?.download("png")
  }

  async function handleExportSvg() {
    await previewRef.current?.download("svg")
  }

  async function handleExportPdf() {
    const blob = await previewRef.current?.getRawData("png")
    if (!blob) return
    const dataUrl = await blobToDataUrl(blob)
    const { jsPDF } = await import("jspdf")
    const pdf = new jsPDF({ unit: "pt", format: "a4" })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const size = Math.min(pageWidth, pageHeight) - 96
    const x = (pageWidth - size) / 2
    const y = (pageHeight - size) / 2
    pdf.addImage(dataUrl, "PNG", x, y, size, size, undefined, "FAST")
    if (style.caption.text) {
      pdf.setFontSize(14)
      pdf.text(style.caption.text, pageWidth / 2, y + size + 28, {
        align: "center",
      })
    }
    pdf.save(`${created?.slug ?? "qr"}.pdf`)
  }

  async function copy(value: string, key: "short" | "owner") {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(null), 1600)
    } catch {}
  }

  function reset() {
    setCreated(null)
    setState({ kind: "idle" })
    setTargetUrl("")
    setTitle("")
  }

  return (
    <section className="flex h-full flex-col">
      <Card className="relative flex flex-1 flex-col gap-6 overflow-hidden p-6 sm:p-10">
        <header className="flex flex-col items-center gap-2 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5" />
            Customize · share · track clicks
          </span>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            QR Studio
          </h2>
          <div className="text-sm text-muted-foreground sm:text-base">
            <ShimmeringText
              text="Design a branded QR. Share the short link. Watch the scans."
              duration={3}
              spread={1.5}
            />
          </div>
        </header>

        <form
          onSubmit={handleCreate}
          className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="flex flex-col gap-4 lg:order-1">
            <div className="flex flex-col gap-2">
              <Label htmlFor="qr-title" className="text-xs font-medium text-muted-foreground">
                Title (yours, for the dashboard)
              </Label>
              <Input
                id="qr-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Launch announcement poster"
                disabled={isCreating || !!created}
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="qr-url" className="text-xs font-medium text-muted-foreground">
                Target URL
              </Label>
              <Input
                id="qr-url"
                type="url"
                required
                maxLength={2048}
                value={targetUrl}
                onChange={(e) => {
                  // Hard slice — `maxLength` doesn't enforce on paste in some
                  // browsers, and a multi-KB data: URL pasted here will crash
                  // the QR encoder.
                  const v = e.target.value
                  setTargetUrl(
                    v.startsWith("data:") ? "" : v.slice(0, 2048)
                  )
                }}
                placeholder="https://your-thing.com/launch"
                disabled={isCreating || !!created}
                className="h-10"
              />
            </div>

            <Separator className="opacity-60" />

            <QrCustomizer
              style={style}
              onChange={setStyle}
              disabled={isCreating}
            />

            {state.kind === "error" && (
              <p className="flex items-start gap-2 text-xs text-destructive">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>{state.message}</span>
              </p>
            )}

            {!created && (
              <Button type="submit" disabled={isCreating} className="h-11">
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating tracked link…
                  </>
                ) : (
                  <>
                    <QrCodeIcon className="size-4" />
                    Create tracked QR
                  </>
                )}
              </Button>
            )}

            {created && (
              <div className="flex flex-col gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <Check className="size-3.5" />
                  <span>Live · tracking clicks on this short URL</span>
                </div>

                <FieldCopy
                  label="Short URL"
                  value={created.shortUrl}
                  copied={copied === "short"}
                  onCopy={() => copy(created.shortUrl, "short")}
                  icon={<Link2 className="size-3.5" />}
                />

                <FieldCopy
                  label="Owner key (save this!)"
                  value={created.ownerKey}
                  copied={copied === "owner"}
                  onCopy={() => copy(created.ownerKey, "owner")}
                  secret
                />

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/tools/qr/${created.slug}`}>Open dashboard →</Link>
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={reset}>
                    Create another
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 lg:order-2">
            <div className="rounded-lg border border-border/40 bg-background/30 p-4">
              <QrPreview
                ref={previewRef}
                data={previewData}
                style={style}
                caption={style.caption.text}
                filename={created?.slug ?? "qr-code"}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportPng}
                className="h-9 gap-1.5 text-xs"
              >
                <FileImage className="size-3.5" />
                PNG
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportSvg}
                className="h-9 gap-1.5 text-xs"
              >
                <Download className="size-3.5" />
                SVG
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportPdf}
                className="h-9 gap-1.5 text-xs"
              >
                <FileText className="size-3.5" />
                PDF
              </Button>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              {created
                ? "Exports encode the short URL — clicks are tracked."
                : "Exports now encode the target URL directly (no tracking). Create to get a tracked short link."}
            </p>
          </div>
        </form>
      </Card>
    </section>
  )
}

function FieldCopy({
  label,
  value,
  copied,
  onCopy,
  icon,
  secret,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
  icon?: React.ReactNode
  secret?: boolean
}) {
  const [revealed, setRevealed] = useState(!secret)
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-[11px] font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2 py-1.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <code
          className={cn(
            "flex-1 truncate font-mono text-xs",
            secret && !revealed && "blur-[3px] select-none"
          )}
        >
          {value}
        </code>
        {secret && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setRevealed((r) => !r)}
          >
            {revealed ? "Hide" : "Reveal"}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onCopy}
          aria-label="Copy"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
    </div>
  )
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
