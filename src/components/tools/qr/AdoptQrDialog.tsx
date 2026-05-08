"use client"

import { useState } from "react"
import { AlertCircle, Check, KeyRound, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveOwnerKey } from "./storage"

const SLUG_RE = /^[A-Za-z0-9]{6,12}$/

/** Accepts a raw slug, /r/slug path, or full short URL. Returns just the slug. */
function parseSlug(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (SLUG_RE.test(trimmed)) return trimmed
  // Try as URL
  try {
    const u = new URL(trimmed)
    const m = /\/r\/([A-Za-z0-9]{6,12})$/.exec(u.pathname)
    if (m) return m[1]!
  } catch {}
  // Try as path
  const m = /\/r\/([A-Za-z0-9]{6,12})$/.exec(trimmed)
  if (m) return m[1]!
  return null
}

export function AdoptQrDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (next: boolean) => void
}) {
  const [shortUrlOrSlug, setShortUrlOrSlug] = useState("")
  const [ownerKey, setOwnerKey] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function reset() {
    setShortUrlOrSlug("")
    setOwnerKey("")
    setPending(false)
    setError(null)
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    const slug = parseSlug(shortUrlOrSlug)
    if (!slug) {
      setError("Couldn't parse a slug from that. Paste the short URL like nandishwarsingh.com/r/xxxxxxx, or just the slug itself.")
      return
    }
    const key = ownerKey.trim()
    if (!key) {
      setError("Owner key is required.")
      return
    }
    setPending(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/qr/${slug}?ownerKey=${encodeURIComponent(key)}`
      )
      if (res.status === 404) {
        setError("No QR with that slug. Check the URL or generate a new one.")
        return
      }
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error ?? `Failed (${res.status})`)
        return
      }
      if (!body?.isOwner) {
        setError("That owner key doesn't match this QR. Check for a typo or extra spaces.")
        return
      }
      saveOwnerKey(slug, key, body.link?.title ?? "Adopted QR")
      setSuccess(true)
      // Brief flash, then close
      setTimeout(() => {
        onOpenChange(false)
        reset()
      }, 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (pending) return
        onOpenChange(v)
        if (!v) setTimeout(reset, 200)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground">
              <KeyRound className="size-3.5" />
            </span>
            <DialogTitle className="text-base">Adopt an existing QR</DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
            If you generated a QR on another device or after clearing this
            browser's data, paste its short URL and owner key below. The server
            verifies the key, then this browser can edit / delete / view stats
            for that QR like normal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="adopt-url"
              className="text-xs font-medium text-muted-foreground"
            >
              Short URL or slug
            </Label>
            <Input
              id="adopt-url"
              value={shortUrlOrSlug}
              onChange={(e) => setShortUrlOrSlug(e.target.value)}
              placeholder="nandishwarsingh.com/r/xxxxxxx"
              disabled={pending || success}
              className="h-9 font-mono text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="adopt-key"
              className="text-xs font-medium text-muted-foreground"
            >
              Owner key
            </Label>
            <Input
              id="adopt-key"
              value={ownerKey}
              onChange={(e) => setOwnerKey(e.target.value)}
              placeholder="The base64 string the studio showed you"
              disabled={pending || success}
              className="h-9 font-mono text-sm"
            />
          </div>

          {error && (
            <p className="flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
          {success && (
            <p className="flex items-center gap-2 text-xs text-emerald-300">
              <Check className="size-3.5" />
              Added to your list.
            </p>
          )}

          <DialogFooter className="mt-1 flex-row justify-end gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending || success}>
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : success ? (
                <Check className="size-3.5" />
              ) : (
                "Verify & adopt"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
