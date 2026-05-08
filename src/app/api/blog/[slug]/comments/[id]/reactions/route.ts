import { ObjectId } from "mongodb"
import type { NextRequest } from "next/server"
import { comments } from "@/lib/db"
import { ReactionToggleSchema, hashIdentity } from "@/lib/comments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Params = { slug: string; id: string }

function identityToken(req: NextRequest): string | null {
  return req.headers.get("x-identity-token")?.trim() || null
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { slug, id } = await ctx.params
  if (!ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid id" }, { status: 400 })
  }
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

  const cm = await comments()
  const c = await cm.findOne({ _id: new ObjectId(id), postSlug: slug })
  if (!c || c.deleted) {
    return Response.json({ error: "Comment not found" }, { status: 404 })
  }

  const already = (c.reactions?.[emoji] ?? []).includes(tokenHash)
  if (already) {
    await cm.updateOne(
      { _id: c._id },
      { $pull: { [`reactions.${emoji}`]: tokenHash } as Record<string, string> }
    )
  } else {
    await cm.updateOne(
      { _id: c._id },
      { $addToSet: { [`reactions.${emoji}`]: tokenHash } as Record<string, string> }
    )
  }

  const after = await cm.findOne(
    { _id: c._id },
    { projection: { reactions: 1 } }
  )
  return Response.json({
    ok: true,
    reactions: after?.reactions ?? {},
    reacted: !already,
  })
}
