import { z } from "zod"

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,80}[a-z0-9])?$/

export function slugify(input: string, fallback = "post"): string {
  const out = input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
  return out || fallback
}

/** Average reading speed of ~200 wpm; counts words after stripping markdown. */
export function readingTimeMinutes(body: string): number {
  const stripped = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`~|-]+/g, " ")
  const words = stripped.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/** Empty / blank strings collapse to `undefined` so optional fields don't fail validators. */
const blankToUndef = (v: unknown): unknown =>
  typeof v === "string" && v.trim() === "" ? undefined : v

/** Accepts an absolute URL OR a server-relative path like /uploads/2026/foo.png (used for uploaded images). */
const URL_OR_PATH = z
  .string()
  .refine(
    (v) => /^https?:\/\//i.test(v) || /^\/[\w./\-+%@]+$/.test(v),
    { message: "Must be a full URL or a path starting with /" }
  )

const optionalUrlOrPath = z.preprocess(blankToUndef, URL_OR_PATH.optional())
const optionalString = (max: number) =>
  z.preprocess(blankToUndef, z.string().trim().max(max).optional())

export const SeoSchema = z.object({
  metaTitle: optionalString(70),
  metaDescription: optionalString(180),
  keywords: z.array(z.string().trim().max(40)).max(20).default([]),
  canonicalUrl: optionalUrlOrPath,
  ogImage: optionalUrlOrPath,
})

export const PostCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().regex(SLUG_RE).optional(),
  summary: z.string().trim().min(10).max(280),
  body: z.string().trim().min(10).max(200_000),
  coverImage: optionalUrlOrPath,
  tags: z.array(z.string().trim().max(40)).max(20).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
  seo: SeoSchema.default({ keywords: [] }),
})

export const PostPatchSchema = PostCreateSchema.partial().extend({
  slug: z.string().regex(SLUG_RE).optional(),
})

export type PostCreateInput = z.infer<typeof PostCreateSchema>
export type PostPatchInput = z.infer<typeof PostPatchSchema>

export function ensureKeywords(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String).map((s) => s.trim()).filter(Boolean)
  if (typeof input === "string") {
    return input.split(",").map((s) => s.trim()).filter(Boolean)
  }
  return []
}
