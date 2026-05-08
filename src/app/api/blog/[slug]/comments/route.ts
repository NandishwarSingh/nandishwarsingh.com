import { createHash } from "node:crypto"
import { ObjectId } from "mongodb"
import type { NextRequest } from "next/server"
import {
  comments,
  ensureIndexes,
  posts,
  type Comment,
} from "@/lib/db"
import {
  CommentCreateSchema,
  MAX_DEPTH,
  gravatarHash,
  hashIdentity,
} from "@/lib/comments"
import { clientIp, rateLimit } from "@/lib/ratelimit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Params = { slug: string }

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,80}[a-z0-9])?$/

function identityToken(req: NextRequest): string | null {
  return req.headers.get("x-identity-token")?.trim() || null
}

/** Public projection — never leaks the raw token or the IP. */
function publicShape(c: Comment) {
  return {
    id: c._id?.toString(),
    parentId: c.parentId?.toString() ?? null,
    rootId: c.rootId?.toString() ?? null,
    depth: c.depth,
    body: c.deleted ? "" : c.body,
    deleted: c.deleted,
    authorName: c.deleted ? null : c.authorName,
    authorTokenHash: c.deleted ? null : c.authorTokenHash,
    authorEmailHash: c.deleted ? null : c.authorEmailHash,
    createdAt: c.createdAt.toISOString(),
    editedAt: c.editedAt?.toISOString(),
    reactions: c.reactions ?? {},
    replyCount: c.replyCount,
  }
}

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { slug } = await ctx.params
  if (!SLUG_RE.test(slug)) {
    return Response.json({ error: "Invalid slug" }, { status: 400 })
  }
  await ensureIndexes()
  const cm = await comments()
  const list = await cm
    .find({ postSlug: slug })
    .sort({ createdAt: 1 })
    .toArray()
  return Response.json({
    slug,
    comments: list.map(publicShape),
    total: list.length,
  })
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const { slug } = await ctx.params
  if (!SLUG_RE.test(slug)) {
    return Response.json({ error: "Invalid slug" }, { status: 400 })
  }

  const ip = clientIp(request)
  const rl = await rateLimit("comment-create", ip, 5, 60_000)
  if (!rl.ok) {
    return Response.json(
      { error: "Slow down — too many comments in the last minute." },
      { status: 429 }
    )
  }

  const ps = await posts()
  const post = await ps.findOne({ slug, status: "published" })
  if (!post) return Response.json({ error: "Post not found" }, { status: 404 })

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = CommentCreateSchema.safeParse(payload)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return Response.json(
      { error: `${issue?.path.join(".") ?? "(root)"}: ${issue?.message}` },
      { status: 400 }
    )
  }
  const { body, parentId, authorName, authorEmail } = parsed.data

  const token = identityToken(request)
  if (!token || token.length < 10 || token.length > 200) {
    return Response.json(
      { error: "Missing X-Identity-Token header" },
      { status: 400 }
    )
  }
  const tokenHash = hashIdentity(token)
  const ipHash = createHash("sha256").update(ip + "|comments").digest("hex").slice(0, 24)

  await ensureIndexes()
  const cm = await comments()

  let parent: Comment | null = null
  let depth = 0
  let rootId: ObjectId | null = null
  if (parentId) {
    parent = await cm.findOne({
      _id: new ObjectId(parentId),
      postSlug: slug,
    })
    if (!parent) return Response.json({ error: "Parent comment not found" }, { status: 404 })
    depth = parent.depth + 1
    if (depth > MAX_DEPTH) {
      return Response.json(
        { error: `Reply chain capped at ${MAX_DEPTH + 1} deep` },
        { status: 400 }
      )
    }
    rootId = parent.rootId ?? parent._id ?? null
  }

  const now = new Date()
  const doc: Comment = {
    postSlug: slug,
    parentId: parent?._id ?? null,
    rootId,
    depth,
    body,
    authorName,
    authorTokenHash: tokenHash,
    authorEmailHash: authorEmail ? gravatarHash(authorEmail) : undefined,
    createdAt: now,
    deleted: false,
    reactions: {},
    replyCount: 0,
    ipHash,
  }
  const ins = await cm.insertOne(doc)

  if (parent?._id) {
    await cm.updateOne({ _id: parent._id }, { $inc: { replyCount: 1 } })
  }

  return Response.json({
    ok: true,
    comment: publicShape({ ...doc, _id: ins.insertedId }),
  })
}
