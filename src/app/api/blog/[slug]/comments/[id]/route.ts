import { ObjectId } from "mongodb"
import type { NextRequest } from "next/server"
import { comments } from "@/lib/db"
import { CommentPatchSchema, hashIdentity } from "@/lib/comments"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Params = { slug: string; id: string }

function identityToken(req: NextRequest): string | null {
  return req.headers.get("x-identity-token")?.trim() || null
}

export async function PATCH(
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
  const parsed = CommentPatchSchema.safeParse(payload)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return Response.json(
      { error: `${issue?.path.join(".") ?? "(root)"}: ${issue?.message}` },
      { status: 400 }
    )
  }

  const cm = await comments()
  const tokenHash = hashIdentity(token)
  const res = await cm.findOneAndUpdate(
    { _id: new ObjectId(id), postSlug: slug, authorTokenHash: tokenHash, deleted: false },
    { $set: { body: parsed.data.body, editedAt: new Date() } },
    { returnDocument: "after" }
  )
  if (!res) {
    return Response.json(
      { error: "Not your comment, or it was deleted" },
      { status: 404 }
    )
  }
  return Response.json({ ok: true })
}

export async function DELETE(
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
  const cm = await comments()
  const tokenHash = hashIdentity(token)
  const res = await cm.findOneAndUpdate(
    { _id: new ObjectId(id), postSlug: slug, authorTokenHash: tokenHash },
    {
      $set: {
        deleted: true,
        body: "",
        editedAt: new Date(),
      },
    }
  )
  if (!res) {
    return Response.json(
      { error: "Not your comment" },
      { status: 404 }
    )
  }
  return Response.json({ ok: true })
}
