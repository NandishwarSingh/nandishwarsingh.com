"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, MessageSquare, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  getIdentityToken,
  getStoredEmail,
  getStoredName,
  setStoredEmail,
  setStoredName,
} from "./identity"

type Props = {
  postSlug: string
  parentId?: string
  /** When set, we're editing — body prefilled, button says "Save". */
  editingId?: string
  initialBody?: string
  onCancel?: () => void
  onSubmitted?: () => void
  compact?: boolean
}

export function CommentForm({
  postSlug,
  parentId,
  editingId,
  initialBody,
  onCancel,
  onSubmitted,
  compact,
}: Props) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [body, setBody] = useState(initialBody ?? "")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(getStoredName())
    setEmail(getStoredEmail())
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    if (!editingId && !name.trim()) {
      setError("Name is required")
      return
    }
    if (!body.trim()) {
      setError("Comment can't be empty")
      return
    }
    setPending(true)
    setError(null)
    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "X-Identity-Token": getIdentityToken(),
      }
      let res: Response
      if (editingId) {
        res = await fetch(
          `/api/blog/${postSlug}/comments/${editingId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ body }),
          }
        )
      } else {
        res = await fetch(`/api/blog/${postSlug}/comments`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            body,
            parentId,
            authorName: name.trim(),
            authorEmail: email.trim() || undefined,
          }),
        })
      }
      const out = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(out?.error ?? `Failed (${res.status})`)
        return
      }
      // Persist identity for next time
      if (!editingId) {
        setStoredName(name.trim())
        setStoredEmail(email.trim())
        setBody("")
      }
      onSubmitted?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className={
        compact
          ? "flex flex-col gap-2 rounded-md border border-border/40 bg-background/30 p-3"
          : "flex flex-col gap-3 rounded-lg border border-border/40 bg-background/30 p-4"
      }
    >
      {!editingId && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`name-${parentId ?? "root"}`} className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Name
            </Label>
            <Input
              id={`name-${parentId ?? "root"}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              disabled={pending}
              placeholder="Your name"
              className="h-9 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`email-${parentId ?? "root"}`} className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Email <span className="ml-1 normal-case text-muted-foreground/80">(optional, for gravatar)</span>
            </Label>
            <Input
              id={`email-${parentId ?? "root"}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              disabled={pending}
              placeholder="you@example.com"
              className="h-9 text-sm"
            />
          </div>
        </div>
      )}

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
        required
        disabled={pending}
        placeholder={
          editingId
            ? "Edit your comment…"
            : parentId
              ? "Write your reply… markdown welcome."
              : "Share your thoughts… markdown welcome."
        }
        rows={compact ? 3 : 4}
        className="resize-y text-sm"
      />

      {error && (
        <p className="flex items-start gap-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          Markdown supported. Rate-limited to 5 / minute. {body.length}/5000
        </p>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={pending}
              className="h-8 gap-1 text-xs"
            >
              <X className="size-3.5" />
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={pending} className="h-8 gap-1.5 text-xs">
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : editingId ? (
              <>
                <Send className="size-3.5" />
                Save
              </>
            ) : parentId ? (
              <>
                <MessageSquare className="size-3.5" />
                Reply
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                Post comment
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
