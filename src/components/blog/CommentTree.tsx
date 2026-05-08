"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CornerDownRight, Pencil, Reply, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/tools/qr/ConfirmDialog"
import { cn } from "@/lib/utils"
import { MAX_DEPTH } from "@/lib/comments"
import { Avatar } from "./Avatar"
import { CommentForm } from "./CommentForm"
import { CommentMarkdown } from "./CommentMarkdown"
import { ReactionBar } from "./ReactionBar"
import { getIdentityHash, getIdentityToken } from "./identity"

export type CommentDto = {
  id: string
  parentId: string | null
  rootId: string | null
  depth: number
  body: string
  deleted: boolean
  authorName: string | null
  authorTokenHash: string | null
  authorEmailHash?: string
  createdAt: string
  editedAt?: string
  reactions: Record<string, string[]>
  replyCount: number
}

type Node = CommentDto & { children: Node[] }

export function CommentTree({
  postSlug,
  comments,
}: {
  postSlug: string
  comments: CommentDto[]
}) {
  const tree = buildTree(comments)
  return (
    <ol className="flex flex-col gap-4">
      {tree.map((node) => (
        <CommentNode
          key={node.id}
          postSlug={postSlug}
          node={node}
          isReply={false}
        />
      ))}
    </ol>
  )
}

function buildTree(list: CommentDto[]): Node[] {
  const byId = new Map<string, Node>()
  const roots: Node[] = []
  for (const c of list) {
    byId.set(c.id, { ...c, children: [] })
  }
  for (const c of list) {
    const node = byId.get(c.id)!
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  // Newest top-level first; replies stay chronological so the conversation reads top-down.
  roots.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return roots
}

function CommentNode({
  postSlug,
  node,
  isReply,
}: {
  postSlug: string
  node: Node
  isReply: boolean
}) {
  const router = useRouter()
  const [identityHash, setIdentityHash] = useState<string | null>(null)
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    void getIdentityHash().then(setIdentityHash)
  }, [])

  const isMine =
    !node.deleted &&
    !!identityHash &&
    !!node.authorTokenHash &&
    node.authorTokenHash === identityHash
  const canReply = node.depth < MAX_DEPTH

  async function handleDelete() {
    const res = await fetch(`/api/blog/${postSlug}/comments/${node.id}`, {
      method: "DELETE",
      headers: {
        "X-Identity-Token": getIdentityToken(),
      },
    })
    if (res.ok) router.refresh()
  }

  return (
    <li className={cn("relative flex flex-col gap-2", isReply && "pl-2")}>
      {isReply && (
        <CornerDownRight
          aria-hidden
          className="absolute -left-[26px] top-3 size-3 text-border"
        />
      )}
      <article
        className="flex gap-3 rounded-lg border border-border/40 bg-background/30 p-4"
        data-comment-id={node.id}
      >
        <Avatar
          name={node.authorName ?? "Anonymous"}
          emailHash={node.authorEmailHash}
          size={36}
          className="shrink-0"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <header className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">
                {node.deleted ? "[deleted]" : node.authorName}
              </span>
              <span aria-hidden>·</span>
              <time dateTime={node.createdAt}>
                {formatRelative(node.createdAt)}
              </time>
              {node.editedAt && !node.deleted && (
                <>
                  <span aria-hidden>·</span>
                  <span title={`Edited ${node.editedAt}`}>edited</span>
                </>
              )}
              {isMine && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300">
                  You
                </span>
              )}
            </div>
            {isMine && !editing && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditing(true)}
                  aria-label="Edit"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )}
          </header>

          {editing ? (
            <CommentForm
              postSlug={postSlug}
              editingId={node.id}
              initialBody={node.body}
              compact
              onCancel={() => setEditing(false)}
              onSubmitted={() => setEditing(false)}
            />
          ) : node.deleted ? (
            <p className="text-sm italic text-muted-foreground">
              This comment was deleted.
            </p>
          ) : (
            <CommentMarkdown content={node.body} />
          )}

          {!node.deleted && !editing && (
            <footer className="flex flex-wrap items-center gap-3">
              <ReactionBar
                initial={node.reactions}
                endpoint={`/api/blog/${postSlug}/comments/${node.id}/reactions`}
              />
              {canReply && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setReplying((v) => !v)}
                >
                  <Reply className="size-3.5" />
                  {replying ? "Cancel reply" : "Reply"}
                </Button>
              )}
            </footer>
          )}

          {replying && (
            <CommentForm
              postSlug={postSlug}
              parentId={node.id}
              compact
              onCancel={() => setReplying(false)}
              onSubmitted={() => setReplying(false)}
            />
          )}
        </div>
      </article>

      {node.children.length > 0 && (
        <ol className="ml-5 flex flex-col gap-3 border-l-2 border-border/40 pl-4">
          {node.children
            .slice()
            .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
            .map((child) => (
              <CommentNode
                key={child.id}
                postSlug={postSlug}
                node={child}
                isReply
              />
            ))}
        </ol>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        destructive
        title="Delete this comment?"
        description="The comment will be replaced with '[deleted]'. Replies underneath will stay visible so the thread structure isn't broken."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </li>
  )
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffSec = Math.round((now - then) / 1000)
  if (diffSec < 60) return "just now"
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`
  if (diffSec < 7 * 86400) return `${Math.round(diffSec / 86400)}d ago`
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
