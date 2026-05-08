import { MessageSquare } from "lucide-react"
import { comments, posts, ensureIndexes } from "@/lib/db"
import { CommentForm } from "./CommentForm"
import { CommentTree, type CommentDto } from "./CommentTree"
import { ReactionBar } from "./ReactionBar"

/**
 * Server-rendered top of the discussion. Fetches everything once so crawlers
 * (and AI engines) see the comments inline. Hydrated for live actions.
 */
export async function CommentSection({ postSlug }: { postSlug: string }) {
  await ensureIndexes()
  const cm = await comments()
  const ps = await posts()
  const [list, post] = await Promise.all([
    cm.find({ postSlug }).sort({ createdAt: 1 }).toArray(),
    ps.findOne(
      { slug: postSlug, status: "published" },
      { projection: { reactions: 1 } }
    ),
  ])

  const dtos: CommentDto[] = list.map((c) => ({
    id: c._id?.toString() ?? "",
    parentId: c.parentId?.toString() ?? null,
    rootId: c.rootId?.toString() ?? null,
    depth: c.depth,
    body: c.deleted ? "" : c.body,
    deleted: c.deleted,
    authorName: c.deleted ? null : c.authorName,
    authorTokenHash: c.deleted ? null : c.authorTokenHash,
    authorEmailHash: c.deleted ? undefined : c.authorEmailHash,
    createdAt: c.createdAt.toISOString(),
    editedAt: c.editedAt?.toISOString(),
    reactions: c.reactions ?? {},
    replyCount: c.replyCount,
  }))

  const visibleCount = dtos.filter((c) => !c.deleted).length

  return (
    <section
      className="flex flex-col gap-5 border-t border-border/40 pt-8"
      aria-label="Discussion"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <MessageSquare className="size-4 text-muted-foreground" />
          Discussion
          <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] font-normal text-muted-foreground">
            {visibleCount}
          </span>
        </h2>
        <ReactionBar
          initial={post?.reactions ?? {}}
          endpoint={`/api/blog/${postSlug}/reactions`}
        />
      </header>

      <CommentForm postSlug={postSlug} />

      {dtos.length === 0 ? (
        <p className="rounded-md border border-dashed border-border/60 bg-background/30 p-6 text-center text-sm text-muted-foreground">
          Be the first to comment.
        </p>
      ) : (
        <CommentTree postSlug={postSlug} comments={dtos} />
      )}
    </section>
  )
}
