"use client"

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import type { QrStyle } from "@/lib/qr-style"
import { toQrCodeStylingOptions } from "@/lib/qr-style"
import { cn } from "@/lib/utils"

export type QrPreviewHandle = {
  download: (extension: "png" | "svg") => Promise<void>
  getRawData: (extension: "png" | "svg") => Promise<Blob | null>
}

type Props = {
  data: string
  style: QrStyle
  className?: string
  caption?: string
  filename?: string
  /** Maximum visual width in px. Exports still render at `style.width`. */
  maxDisplayPx?: number
}

type QRInstance = {
  append: (el: HTMLElement) => void
  update: (opts: Record<string, unknown>) => void
  download: (opts: { extension: string; name?: string }) => Promise<void>
  getRawData: (ext: string) => Promise<Blob | null>
}

type QRCtor = new (opts: Record<string, unknown>) => QRInstance

export const QrPreview = forwardRef<QrPreviewHandle, Props>(function QrPreview(
  { data, style, className, caption, filename = "qr-code", maxDisplayPx = 280 },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<QRInstance | null>(null)
  const [ready, setReady] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)

  // Hard cap — QR v40 with EC level L tops out around 2,953 alphanumeric chars
  // / ~7,089 numeric / ~13,328 byte capacity. Anything bigger throws inside
  // qr-code-styling. URLs above ~2 KB don't scan reliably anyway.
  const MAX_DATA_LEN = 2048
  const safeData = useMemo(() => {
    const raw = data || " "
    if (raw.length > MAX_DATA_LEN) return raw.slice(0, MAX_DATA_LEN)
    return raw
  }, [data])
  const tooLong = (data?.length ?? 0) > MAX_DATA_LEN

  const options = useMemo(
    () => toQrCodeStylingOptions(style, safeData),
    [style, safeData]
  )

  useEffect(() => {
    let cancelled = false
    import("qr-code-styling").then((mod) => {
      if (cancelled) return
      const QRCodeStyling = mod.default as unknown as QRCtor
      try {
        const inst = new QRCodeStyling(options)
        instanceRef.current = inst
        if (containerRef.current) {
          containerRef.current.innerHTML = ""
          inst.append(containerRef.current)
        }
        setReady(true)
        setRenderError(null)
      } catch (err) {
        setRenderError(err instanceof Error ? err.message : "QR render failed")
      }
    })
    return () => {
      cancelled = true
    }
    // Only initialize once — updates are pushed via a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const inst = instanceRef.current
    if (!inst) return
    try {
      inst.update(options)
      setRenderError(null)
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : "QR render failed")
    }
  }, [options])

  useImperativeHandle(ref, () => ({
    async download(extension) {
      const inst = instanceRef.current
      if (!inst) return
      await inst.download({ extension, name: filename })
    },
    async getRawData(extension) {
      const inst = instanceRef.current
      if (!inst) return null
      return inst.getRawData(extension)
    },
  }))

  return (
    <div className={cn("flex w-full flex-col items-center gap-3", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg border border-border/40 bg-white p-2",
          "transition-opacity",
          !ready && "opacity-0"
        )}
        style={{ maxWidth: `${maxDisplayPx}px` }}
      >
        <div
          ref={containerRef}
          className={cn(
            "mx-auto flex aspect-square w-full items-center justify-center",
            // qr-code-styling sets fixed width/height attrs on the svg/canvas.
            // Force them to scale to the container so the preview can never
            // overflow even when the user picks a 2048px export size.
            "[&>canvas]:!h-full [&>canvas]:!w-full",
            "[&>svg]:!h-full [&>svg]:!w-full"
          )}
        />
      </div>
      {(tooLong || renderError) && (
        <p className="text-center text-[11px] text-amber-300">
          {tooLong
            ? `Input is ${data?.length ?? 0} chars — capped at ${MAX_DATA_LEN} for the preview. Real QR codes can't encode much more than that without becoming unscannable.`
            : `QR render failed: ${renderError}`}
        </p>
      )}
      {caption && (
        <div
          className="text-center text-xs font-medium break-words"
          style={{ color: style.caption.color ?? "#ededed" }}
        >
          {caption}
        </div>
      )}
    </div>
  )
})
