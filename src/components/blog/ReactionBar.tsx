"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Plus, SmilePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { REACTION_EMOJIS, type ReactionEmoji } from "@/lib/comments"
import { cn } from "@/lib/utils"
import { getIdentityHash, getIdentityToken } from "./identity"

type Reactions = Record<string, string[]>

type Props = {
  /** Initial reactions map fetched server-side. */
  initial: Reactions
  /** Endpoint to POST `{ emoji }` toggles to. */
  endpoint: string
}

export function ReactionBar({ initial, endpoint }: Props) {
  const [reactions, setReactions] = useState<Reactions>(initial)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [identityHash, setIdentityHash] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    void getIdentityHash().then(setIdentityHash)
  }, [])

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return
    function onDoc(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [pickerOpen])

  const visible = useMemo(() => {
    return REACTION_EMOJIS.filter((e) => (reactions[e] ?? []).length > 0)
  }, [reactions])

  async function toggle(emoji: ReactionEmoji) {
    if (pending === emoji) return
    setPending(emoji)
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Identity-Token": getIdentityToken(),
        },
        body: JSON.stringify({ emoji }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok && body?.reactions) {
        setReactions(body.reactions as Reactions)
      }
    } finally {
      setPending(null)
      setPickerOpen(false)
    }
  }

  return (
    <div className="relative flex flex-wrap items-center gap-1.5">
      {visible.map((emoji) => {
        const list = reactions[emoji] ?? []
        const mine = identityHash ? list.includes(identityHash) : false
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            disabled={pending === emoji}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
              mine
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                : "border-border/60 bg-background/60 text-muted-foreground hover:bg-background/80"
            )}
          >
            <span className="text-sm leading-none">{emoji}</span>
            <span className="font-mono tabular-nums">{list.length}</span>
          </button>
        )
      })}

      <div className="relative" ref={pickerRef}>
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border/60 bg-background/30 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-background/60"
          aria-label="Add reaction"
        >
          {visible.length === 0 ? (
            <>
              <SmilePlus className="size-3.5" />
              React
            </>
          ) : (
            <Plus className="size-3" />
          )}
        </button>
        {pickerOpen && (
          <div className="absolute left-0 top-full z-10 mt-1 flex gap-1 rounded-md border border-border/60 bg-popover p-1 shadow-lg">
            {REACTION_EMOJIS.map((e) => (
              <Button
                key={e}
                type="button"
                size="icon"
                variant="ghost"
                disabled={pending === e}
                onClick={() => toggle(e)}
                className="h-8 w-8 text-base"
              >
                {e}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
