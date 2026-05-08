"use client"

import { useRef } from "react"
import { ImagePlus, X } from "lucide-react"
import {
  QR_CORNERS_DOT,
  QR_CORNERS_SQUARE,
  QR_DOTS,
  QR_ERROR_LEVELS,
  type QrStyle,
} from "@/lib/qr-style"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  style: QrStyle
  onChange: (next: QrStyle) => void
  disabled?: boolean
}

function set<K extends keyof QrStyle>(style: QrStyle, key: K, value: QrStyle[K]): QrStyle {
  return { ...style, [key]: value }
}

/**
 * Resize the uploaded logo to a small canvas (≤256px on the long side) before
 * encoding to data URL. Without this, large source images become 100KB+ base64
 * strings that crash qr-code-styling's underlying QR encoder. SVGs pass
 * through untouched (they're already small and vector).
 */
async function loadAndShrinkImage(file: File, maxDim = 256): Promise<string> {
  if (file.type === "image/svg+xml") {
    return readAsDataUrl(file)
  }
  const blobUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("Could not decode image"))
      el.src = blobUrl
    })
    const longSide = Math.max(img.width, img.height)
    const ratio = Math.min(1, maxDim / longSide)
    const w = Math.max(1, Math.round(img.width * ratio))
    const h = Math.max(1, Math.round(img.height * ratio))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas not supported")
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL("image/png")
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const MAX_LOGO_DATAURL_BYTES = 60_000 // hard ceiling after resize

export function QrCustomizer({ style, onChange, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await loadAndShrinkImage(file)
      if (dataUrl.length > MAX_LOGO_DATAURL_BYTES) {
        alert(
          `Logo is still too large after resize (${Math.round(dataUrl.length / 1024)} KB). Try a simpler image.`
        )
        e.target.value = ""
        return
      }
      onChange(set(style, "image", { ...style.image, dataUrl }))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not load image")
    } finally {
      e.target.value = ""
    }
  }

  function clearLogo() {
    onChange(
      set(style, "image", {
        ...style.image,
        dataUrl: undefined,
      })
    )
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <Tabs defaultValue="shape" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="shape">Shape</TabsTrigger>
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="logo">Logo</TabsTrigger>
        <TabsTrigger value="caption">Caption</TabsTrigger>
      </TabsList>

      <TabsContent value="shape" className="mt-4 flex flex-col gap-3">
        <FieldSelect
          label="Dot style"
          value={style.dots.type}
          onChange={(v) =>
            onChange(
              set(style, "dots", {
                ...style.dots,
                type: v as QrStyle["dots"]["type"],
              })
            )
          }
          options={QR_DOTS.map((v) => ({ value: v, label: v }))}
          disabled={disabled}
        />
        <div className="grid grid-cols-2 gap-3">
          <FieldSelect
            label="Corner — outer"
            value={style.cornersSquare.type}
            onChange={(v) =>
              onChange(
                set(style, "cornersSquare", {
                  ...style.cornersSquare,
                  type: v as QrStyle["cornersSquare"]["type"],
                })
              )
            }
            options={QR_CORNERS_SQUARE.map((v) => ({ value: v, label: v }))}
            disabled={disabled}
          />
          <FieldSelect
            label="Corner — inner"
            value={style.cornersDot.type}
            onChange={(v) =>
              onChange(
                set(style, "cornersDot", {
                  ...style.cornersDot,
                  type: v as QrStyle["cornersDot"]["type"],
                })
              )
            }
            options={QR_CORNERS_DOT.map((v) => ({ value: v, label: v }))}
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldSelect
            label="Error correction"
            value={style.errorCorrectionLevel}
            onChange={(v) =>
              onChange(
                set(style, "errorCorrectionLevel", v as QrStyle["errorCorrectionLevel"])
              )
            }
            options={QR_ERROR_LEVELS.map((v) => ({
              value: v,
              label:
                v === "L"
                  ? "L — ~7% (smallest)"
                  : v === "M"
                    ? "M — ~15%"
                    : v === "Q"
                      ? "Q — ~25% (recommended)"
                      : "H — ~30% (densest)",
            }))}
            disabled={disabled}
          />
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Size (px)</Label>
            <Input
              type="number"
              value={style.width}
              min={128}
              max={2048}
              step={32}
              disabled={disabled}
              onChange={(e) =>
                onChange(set(style, "width", Number(e.target.value) || 512))
              }
              className="h-9"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="colors" className="mt-4 flex flex-col gap-3">
        <ColorField
          label="Dots"
          value={style.dots.color ?? "#0a0a0a"}
          onChange={(c) =>
            onChange(set(style, "dots", { ...style.dots, color: c, gradient: undefined }))
          }
          disabled={disabled}
        />
        <ColorField
          label="Outer corners"
          value={style.cornersSquare.color ?? "#0a0a0a"}
          onChange={(c) =>
            onChange(
              set(style, "cornersSquare", { ...style.cornersSquare, color: c })
            )
          }
          disabled={disabled}
        />
        <ColorField
          label="Inner corners"
          value={style.cornersDot.color ?? "#0a0a0a"}
          onChange={(c) =>
            onChange(set(style, "cornersDot", { ...style.cornersDot, color: c }))
          }
          disabled={disabled}
        />
        <ColorField
          label="Background"
          value={style.background.color ?? "#ffffff"}
          onChange={(c) =>
            onChange(
              set(style, "background", { color: c, gradient: undefined })
            )
          }
          disabled={disabled}
        />
        <GradientPicker
          current={style.dots.gradient}
          fallbackColor={style.dots.color ?? "#0a0a0a"}
          disabled={disabled}
          onApply={(g) =>
            onChange(
              set(style, "dots", { ...style.dots, gradient: g, color: undefined })
            )
          }
          onClear={() =>
            onChange(
              set(style, "dots", {
                ...style.dots,
                gradient: undefined,
                color: style.dots.color ?? "#0a0a0a",
              })
            )
          }
          label="Gradient on dots"
        />
      </TabsContent>

      <TabsContent value="logo" className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleLogoUpload}
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            <ImagePlus className="size-4" />
            {style.image.dataUrl ? "Replace logo" : "Upload logo"}
          </Button>
          {style.image.dataUrl && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              onClick={clearLogo}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        {style.image.dataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={style.image.dataUrl}
            alt="Logo preview"
            className="h-16 w-16 rounded-md border border-border/40 object-contain bg-white p-1"
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Logo size ({Math.round(style.image.sizePct * 100)}%)
            </Label>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              disabled={disabled || !style.image.dataUrl}
              value={Math.round(style.image.sizePct * 100)}
              onChange={(e) =>
                onChange(
                  set(style, "image", {
                    ...style.image,
                    sizePct: Number(e.target.value) / 100,
                  })
                )
              }
              className="w-full accent-foreground"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Margin</Label>
            <Input
              type="number"
              value={style.image.marginPx}
              min={0}
              max={40}
              disabled={disabled || !style.image.dataUrl}
              onChange={(e) =>
                onChange(
                  set(style, "image", {
                    ...style.image,
                    marginPx: Number(e.target.value) || 0,
                  })
                )
              }
              className="h-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="hide-bg-dots"
            checked={style.image.hideBackgroundDots}
            disabled={disabled || !style.image.dataUrl}
            onCheckedChange={(v) =>
              onChange(
                set(style, "image", {
                  ...style.image,
                  hideBackgroundDots: v === true,
                })
              )
            }
          />
          <Label htmlFor="hide-bg-dots" className="text-xs text-foreground/80">
            Clear dots under logo (easier scan)
          </Label>
        </div>
      </TabsContent>

      <TabsContent value="caption" className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="caption-text"
            className="text-xs font-medium text-muted-foreground"
          >
            Caption (shown below QR in preview)
          </Label>
          <Input
            id="caption-text"
            value={style.caption.text ?? ""}
            maxLength={80}
            disabled={disabled}
            onChange={(e) =>
              onChange(set(style, "caption", { ...style.caption, text: e.target.value }))
            }
            placeholder="e.g. scan to open my portfolio"
            className="h-9"
          />
          <p className="text-[11px] text-muted-foreground">
            Caption appears on the page, not inside the exported image (yet).
          </p>
        </div>
        <ColorField
          label="Caption color"
          value={style.caption.color ?? "#ededed"}
          onChange={(c) =>
            onChange(set(style, "caption", { ...style.caption, color: c }))
          }
          disabled={disabled}
        />
      </TabsContent>
    </Tabs>
  )
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9 w-full capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="capitalize">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-8 w-10 cursor-pointer rounded-md border border-border/60 bg-transparent",
            disabled && "cursor-not-allowed opacity-50"
          )}
        />
        <Input
          value={value.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value.trim()
            if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v.toLowerCase())
          }}
          disabled={disabled}
          className="h-8 w-24 font-mono text-xs uppercase"
        />
      </div>
    </div>
  )
}

function GradientPicker({
  current,
  fallbackColor,
  disabled,
  onApply,
  onClear,
  label,
}: {
  current: QrStyle["dots"]["gradient"]
  fallbackColor: string
  disabled?: boolean
  onApply: (g: NonNullable<QrStyle["dots"]["gradient"]>) => void
  onClear: () => void
  label: string
}) {
  const active = !!current
  const stop0 = current?.colorStops[0]?.color ?? fallbackColor
  const stop1 = current?.colorStops[1]?.color ?? "#7a9fd8"
  const rotation = current?.rotation ?? 0

  function update(
    partial: Partial<NonNullable<QrStyle["dots"]["gradient"]>>
  ) {
    onApply({
      type: current?.type ?? "linear",
      rotation,
      colorStops: [
        { offset: 0, color: stop0 },
        { offset: 1, color: stop1 },
      ],
      ...partial,
    })
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border/40 bg-background/20 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        {active ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClear}
            disabled={disabled}
          >
            Turn off
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => update({})}
            disabled={disabled}
          >
            Turn on
          </Button>
        )}
      </div>
      {active && (
        <div className="grid grid-cols-2 gap-2">
          <ColorField
            label="From"
            value={stop0}
            disabled={disabled}
            onChange={(c) =>
              update({
                colorStops: [
                  { offset: 0, color: c },
                  { offset: 1, color: stop1 },
                ],
              })
            }
          />
          <ColorField
            label="To"
            value={stop1}
            disabled={disabled}
            onChange={(c) =>
              update({
                colorStops: [
                  { offset: 0, color: stop0 },
                  { offset: 1, color: c },
                ],
              })
            }
          />
          <FieldSelect
            label="Type"
            value={current?.type ?? "linear"}
            onChange={(v) => update({ type: v as "linear" | "radial" })}
            options={[
              { value: "linear", label: "Linear" },
              { value: "radial", label: "Radial" },
            ]}
            disabled={disabled}
          />
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Rotation ({Math.round(rotation * (180 / Math.PI))}°)
            </Label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              disabled={disabled}
              value={Math.round(rotation * (180 / Math.PI))}
              onChange={(e) =>
                update({ rotation: Number(e.target.value) * (Math.PI / 180) })
              }
              className="w-full accent-foreground"
            />
          </div>
        </div>
      )}
    </div>
  )
}
