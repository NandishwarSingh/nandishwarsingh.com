import { z } from "zod"
import { createHash } from "node:crypto"

/** Fixed allowlist of emoji reactions — keeps storage clean and the picker scannable. */
export const REACTION_EMOJIS = ["👍", "❤️", "🎉", "🤯", "😄", "👏"] as const
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

export const REACTION_SET = new Set<string>(REACTION_EMOJIS)

export const MAX_DEPTH = 4

const trimmed = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(1).max(max)
  )

export const CommentCreateSchema = z.object({
  body: trimmed(5000),
  parentId: z
    .string()
    .regex(/^[a-f0-9]{24}$/i)
    .optional(),
  authorName: trimmed(60),
  authorEmail: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().email().optional()
    ),
})

export const CommentPatchSchema = z.object({
  body: trimmed(5000),
})

export const ReactionToggleSchema = z.object({
  emoji: z.string().refine((e) => REACTION_SET.has(e), {
    message: "Unsupported emoji",
  }),
})

export type CommentCreateInput = z.infer<typeof CommentCreateSchema>
export type CommentPatchInput = z.infer<typeof CommentPatchSchema>

/** Stable per-identity hash. Stored on the doc; never reverses to the token. */
export function hashIdentity(token: string): string {
  return createHash("sha256")
    .update(`identity|${token}`)
    .digest("hex")
    .slice(0, 24)
}

/** md5 for gravatar; lowercased + trimmed per the spec. */
export function gravatarHash(email: string): string {
  return createHash("md5").update(email.trim().toLowerCase()).digest("hex")
}

export function gravatarUrl(emailHash: string, sizePx = 64): string {
  return `https://www.gravatar.com/avatar/${emailHash}?s=${sizePx}&d=identicon&r=pg`
}

/** Initials from a name — fallback when no email/gravatar. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}
