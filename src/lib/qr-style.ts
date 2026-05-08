import { z } from "zod"

const COLOR = z.string().regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/, "Invalid color")

export const QR_DOTS = [
  "rounded",
  "dots",
  "classy",
  "classy-rounded",
  "square",
  "extra-rounded",
] as const

export const QR_CORNERS_SQUARE = [
  "dot",
  "square",
  "extra-rounded",
] as const

export const QR_CORNERS_DOT = ["dot", "square"] as const

export const QR_ERROR_LEVELS = ["L", "M", "Q", "H"] as const

const GradientStop = z.object({
  offset: z.number().min(0).max(1),
  color: COLOR,
})

const Gradient = z.object({
  type: z.enum(["linear", "radial"]),
  rotation: z.number().optional(),
  colorStops: z.array(GradientStop).min(2).max(2),
})

export const QrStyleSchema = z.object({
  width: z.number().int().min(128).max(2048).default(512),
  margin: z.number().int().min(0).max(40).default(8),
  errorCorrectionLevel: z.enum(QR_ERROR_LEVELS).default("Q"),
  background: z
    .object({
      color: COLOR.optional(),
      gradient: Gradient.optional(),
    })
    .default({ color: "#ffffff" }),
  dots: z
    .object({
      type: z.enum(QR_DOTS).default("rounded"),
      color: COLOR.optional(),
      gradient: Gradient.optional(),
    })
    .default({ type: "rounded", color: "#0a0a0a" }),
  cornersSquare: z
    .object({
      type: z.enum(QR_CORNERS_SQUARE).default("extra-rounded"),
      color: COLOR.optional(),
    })
    .default({ type: "extra-rounded", color: "#0a0a0a" }),
  cornersDot: z
    .object({
      type: z.enum(QR_CORNERS_DOT).default("dot"),
      color: COLOR.optional(),
    })
    .default({ type: "dot", color: "#0a0a0a" }),
  image: z
    .object({
      // base64 data URL of an uploaded logo. Hard-capped — the underlying
      // QR encoder can't tolerate large strings even when they're for the
      // image overlay (some code paths in qr-code-styling stringify options).
      dataUrl: z
        .string()
        .max(80_000)
        .startsWith("data:image/")
        .optional(),
      sizePct: z.number().min(0).max(0.5).default(0.25),
      marginPx: z.number().int().min(0).max(40).default(6),
      hideBackgroundDots: z.boolean().default(true),
    })
    .default({
      sizePct: 0.25,
      marginPx: 6,
      hideBackgroundDots: true,
    }),
  caption: z
    .object({
      text: z.string().max(80).optional(),
      color: COLOR.optional(),
    })
    .default({}),
})

export type QrStyle = z.infer<typeof QrStyleSchema>

export const DEFAULT_STYLE: QrStyle = QrStyleSchema.parse({})

/** Convert our schema into the options shape qr-code-styling expects. */
export function toQrCodeStylingOptions(style: QrStyle, data: string) {
  type Opts = Record<string, unknown>
  const opts: Opts = {
    width: style.width,
    height: style.width,
    type: "svg",
    data,
    margin: style.margin,
    qrOptions: {
      errorCorrectionLevel: style.errorCorrectionLevel,
    },
    backgroundOptions: style.background.gradient
      ? { gradient: style.background.gradient }
      : { color: style.background.color ?? "#ffffff" },
    dotsOptions: style.dots.gradient
      ? { type: style.dots.type, gradient: style.dots.gradient }
      : { type: style.dots.type, color: style.dots.color ?? "#0a0a0a" },
    cornersSquareOptions: {
      type: style.cornersSquare.type,
      color: style.cornersSquare.color ?? "#0a0a0a",
    },
    cornersDotOptions: {
      type: style.cornersDot.type,
      color: style.cornersDot.color ?? "#0a0a0a",
    },
    imageOptions: {
      hideBackgroundDots: style.image.hideBackgroundDots,
      imageSize: style.image.sizePct,
      margin: style.image.marginPx,
      crossOrigin: "anonymous",
    },
  }
  if (style.image.dataUrl) {
    opts.image = style.image.dataUrl
  }
  return opts
}
