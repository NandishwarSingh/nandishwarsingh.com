import type { NextRequest } from "next/server"
import { posts } from "@/lib/db"
import {
  ReactionToggleSchema,
  hashIdentity,
} from "@/lib/comments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Params = { slug: string }

function identityToken(req: NextRequest): string | null {
  return req.headers.get("x-identity-token")?.trim() || null
}

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { slug } = await ctx.params
  const ps = await posts()
  const post = await ps.findOne(
    { slug, status: "published" },
    { projection: { reactions: 1 } }
  )
  if (!post) return Response.json({ error: "Post not found" }, { status: 404 })
  const counts: Record<string, number> = {}
  for (const [emoji, tokens] of Object.entries(post.reactions ?? {})) {
    counts[emoji] = Array.isArray(tokens) ? tokens.length : 0
  }
  return Response.json({ slug, reactions: counts })
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { slug } = await ctx.params
  const token = identityToken(request)
  if (!token) {
    return Response.json({ error: "Missing X-Identity-Token" }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = ReactionToggleSchema.safeParse(payload)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }
  const { emoji } = parsed.data
  const tokenHash = hashIdentity(token)

  const ps = await posts()
  const post = await ps.findOne({ slug, status: "published" })
  if (!post) return Response.json({ error: "Post not found" }, { status: 404 })

  const already = (post.reactions?.[emoji] ?? []).includes(tokenHash)
  if (already) {
    await ps.updateOne(
      { slug },
      { $pull: { [`reactions.${emoji}`]: tokenHash } as Record<string, string> }
    )
  } else {
    await ps.updateOne(
      { slug },
      { $addToSet: { [`reactions.${emoji}`]: tokenHash } as Record<string, string> }
    )
  }

  // Return the updated counts so the client doesn't have to refetch.
  const after = await ps.findOne({ slug }, { projection: { reactions: 1 } })
  return Response.json({
    ok: true,
    reactions: after?.reactions ?? {},
    reacted: !already,
  })
}
