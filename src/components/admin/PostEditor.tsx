"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Eye,
  ImagePlus,
  Loader2,
  Save,
  SquarePlay,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/tools/qr/ConfirmDialog"
import { PostMarkdown } from "@/components/blog/PostMarkdown"
import { readingTimeMinutes, slugify } from "@/lib/posts"
import { cn } from "@/lib/utils"

type EditorPost = {
  slug?: string
  title: string
  summary: string
  body: string
  coverImage: string
  tags: string[]
  status: "draft" | "published"
  seo: {
    metaTitle?: string
    metaDescription?: string
    keywords: string[]
    canonicalUrl?: string
    ogImage?: string
  }
}

const EMPTY: EditorPost = {
  title: "",
  summary: "",
  body: "",
  coverImage: "",
  tags: [],
  status: "draft",
  seo: { keywords: [] },
}

type Props = {
  initial?: EditorPost & { slug: string }
}

export function PostEditor({ initial }: Props) {
  const router = useRouter()
  const editing = !!initial
  const [post, setPost] = useState<EditorPost>(initial ?? EMPTY)
  const [slugTouched, setSlugTouched] = useState(editing)
  const [tagsInput, setTagsInput] = useState(
    initial?.tags.join(", ") ?? ""
  )
  const [keywordsInput, setKeywordsInput] = useState(
    initial?.seo.keywords?.join(", ") ?? ""
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const coverFileRef = useRef<HTMLInputElement | null>(null)

  // Auto-generate slug from title until the user touches it explicitly.
  useEffect(() => {
    if (slugTouched) return
    setPost((p) => ({ ...p, slug: slugify(p.title) }))
  }, [post.title, slugTouched])

  const readingTime = useMemo(
    () => readingTimeMinutes(post.body),
    [post.body]
  )

  function update<K extends keyof EditorPost>(key: K, value: EditorPost[K]) {
    setPost((p) => ({ ...p, [key]: value }))
  }

  function updateSeo<K extends keyof EditorPost["seo"]>(
    key: K,
    value: EditorPost["seo"][K]
  ) {
    setPost((p) => ({ ...p, seo: { ...p.seo, [key]: value } }))
  }

  function insertAtCursor(snippet: string) {
    const el = bodyRef.current
    if (!el) {
      update("body", post.body + "\n" + snippet)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const next =
      post.body.slice(0, start) + snippet + post.body.slice(end)
    update("body", next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + snippet.length
      el.setSelectionRange(pos, pos)
    })
  }

  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/admin/uploads", { method: "POST", body: fd })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(body?.error ?? "Upload failed")
      return null
    }
    return body.url as string
  }

  async function handleInlineImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setPending(true)
    setError(null)
    const url = await uploadFile(file)
    setPending(false)
    if (!url) return
    const isVideo = file.type.startsWith("video/")
    if (isVideo) {
      insertAtCursor(
        `\n<video controls preload="metadata" src="${url}"></video>\n`
      )
    } else {
      insertAtCursor(`\n![${file.name.replace(/\.[^.]+$/, "")}](${url})\n`)
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setPending(true)
    setError(null)
    const url = await uploadFile(file)
    setPending(false)
    if (!url) return
    update("coverImage", url)
    if (!post.seo.ogImage) updateSeo("ogImage", absUrl(url))
  }

  function insertVideoEmbed() {
    const url = window.prompt(
      "Paste a YouTube, Vimeo or direct video URL"
    )?.trim()
    if (!url) return
    const yt = parseYoutube(url)
    if (yt) {
      insertAtCursor(
        `\n<iframe src="https://www.youtube.com/embed/${yt}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" style="aspect-ratio:16/9;width:100%;border:0;border-radius:8px"></iframe>\n`
      )
      return
    }
    const vimeo = parseVimeo(url)
    if (vimeo) {
      insertAtCursor(
        `\n<iframe src="https://player.vimeo.com/video/${vimeo}" title="Vimeo video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy" style="aspect-ratio:16/9;width:100%;border:0;border-radius:8px"></iframe>\n`
      )
      return
    }
    insertAtCursor(
      `\n<video controls preload="metadata" src="${url}" style="width:100%;border-radius:8px"></video>\n`
    )
  }

  async function handleSave() {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      const keywords = keywordsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      const payload = {
        title: post.title.trim(),
        slug: post.slug?.trim() || undefined,
        summary: post.summary.trim(),
        body: post.body,
        coverImage: post.coverImage.trim() || undefined,
        tags,
        status: post.status,
        seo: {
          ...post.seo,
          keywords,
        },
      }
      const url = editing
        ? `/api/admin/posts/${initial!.slug}`
        : "/api/admin/posts"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error ?? `Failed (${res.status})`)
        return
      }
      const newSlug = (body.slug as string) ?? post.slug
      if (!editing && newSlug) {
        router.replace(`/admin/blogs/${newSlug}/edit`)
        router.refresh()
        return
      }
      // For an existing post, refresh data in place.
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  async function handleDelete() {
    if (!editing) return
    const res = await fetch(`/api/admin/posts/${initial!.slug}`, {
      method: "DELETE",
    })
    if (res.ok) router.replace("/admin/blogs")
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {editing ? "Edit blog" : "New blog"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {readingTime} min read · {post.body.length.toLocaleString()} chars · status:{" "}
            <span
              className={
                post.status === "published"
                  ? "text-emerald-300"
                  : "text-amber-300"
              }
            >
              {post.status}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={post.status}
            onValueChange={(v) => update("status", v as EditorPost["status"])}
          >
            <SelectTrigger className="h-9 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          {editing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="h-9 gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={pending || post.title.length < 2 || post.summary.length < 10 || post.body.length < 10}
            className="h-9 gap-1.5"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Save className="size-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </header>

      {error && (
        <Card className="flex items-center gap-2 p-3 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {error}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-4">
            <Field label="Title (h1)">
              <Input
                value={post.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="How I built a multi-tool portfolio with Next.js"
                className="h-10 text-base"
                maxLength={200}
              />
            </Field>
            <Field
              label="Slug"
              hint={`URL: /blog/${post.slug || "your-slug"}`}
            >
              <Input
                value={post.slug ?? ""}
                onChange={(e) => {
                  setSlugTouched(true)
                  update("slug", slugify(e.target.value))
                }}
                placeholder="auto-generated from title"
                className="h-9 font-mono text-sm"
              />
            </Field>
            <Field
              label="Summary (meta description)"
              hint={`${post.summary.length}/180 — used for SEO and the home grid card`}
            >
              <Textarea
                value={post.summary}
                onChange={(e) => update("summary", e.target.value.slice(0, 280))}
                placeholder="A two-sentence pitch that nails what this post solves."
                rows={2}
                className="resize-none text-sm"
              />
            </Field>
          </Card>

          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">
                Body (Markdown — raw HTML allowed)
              </Label>
              <div className="flex items-center gap-1">
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleInlineImage}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  disabled={pending}
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="size-3.5" />
                  Image
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                  onClick={insertVideoEmbed}
                >
                  <SquarePlay className="size-3.5" />
                  Video
                </Button>
              </div>
            </div>

            <Tabs defaultValue="write" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview" className="gap-1.5">
                  <Eye className="size-3.5" />
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="write" className="mt-3">
                <Textarea
                  ref={bodyRef}
                  value={post.body}
                  onChange={(e) => update("body", e.target.value)}
                  placeholder={`# Heading\n\nWrite in markdown. Use \`Image\` to upload, \`Video\` to embed YouTube/Vimeo or upload.\n\n## Why this matters\n\n- bullet points\n- *italics* and **bold**\n- [links](https://example.com)`}
                  className="min-h-[480px] resize-y font-mono text-sm leading-relaxed"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-3">
                <div className="min-h-[480px] rounded-md border border-border/40 bg-background/40 p-4">
                  {post.body.trim() ? (
                    <PostMarkdown content={post.body} />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Nothing to preview yet.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Cover image
            </h3>
            {post.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.coverImage}
                alt="Cover"
                className="aspect-video w-full rounded-md border border-border/40 object-cover"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-border/60 text-xs text-muted-foreground">
                None set
              </div>
            )}
            <Input
              value={post.coverImage}
              onChange={(e) => update("coverImage", e.target.value)}
              placeholder="https://… or upload"
              className="h-8 font-mono text-xs"
            />
            <input
              ref={coverFileRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleCoverUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => coverFileRef.current?.click()}
              className="h-8 gap-1.5 text-xs"
            >
              <ImagePlus className="size-3.5" />
              Upload cover
            </Button>
          </Card>

          <Card className="flex flex-col gap-3 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tags
            </h3>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="nextjs, mongo, side-project"
              className="h-8 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Comma-separated.
            </p>
          </Card>

          <Card className="flex flex-col gap-3 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              SEO + GEO
            </h3>
            <Field label="Meta title (override)" hint="≤ 60 chars works best">
              <Input
                value={post.seo.metaTitle ?? ""}
                onChange={(e) => updateSeo("metaTitle", e.target.value)}
                placeholder="Defaults to title"
                className="h-8 text-sm"
              />
            </Field>
            <Field label="Meta description (override)" hint="≤ 155 chars">
              <Textarea
                value={post.seo.metaDescription ?? ""}
                onChange={(e) => updateSeo("metaDescription", e.target.value)}
                placeholder="Defaults to summary"
                rows={2}
                className="resize-none text-sm"
              />
            </Field>
            <Field label="Keywords" hint="Helps GEO citation engines">
              <Input
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="seo, geo, generative engine"
                className="h-8 text-sm"
              />
            </Field>
            <Field label="OG image URL" hint="Defaults to cover image">
              <Input
                value={post.seo.ogImage ?? ""}
                onChange={(e) => updateSeo("ogImage", e.target.value)}
                placeholder="https://…"
                className="h-8 font-mono text-xs"
              />
            </Field>
            <Field label="Canonical URL">
              <Input
                value={post.seo.canonicalUrl ?? ""}
                onChange={(e) => updateSeo("canonicalUrl", e.target.value)}
                placeholder="https://…"
                className="h-8 font-mono text-xs"
              />
            </Field>
          </Card>

          <Card className="flex flex-col gap-2 p-4 text-xs text-muted-foreground">
            <h3 className="text-xs font-medium uppercase tracking-wider">
              GEO checklist
            </h3>
            <ul className={cn("flex flex-col gap-1.5")}>
              <Check ok={post.body.includes("##")}>
                Use H2s to split sections — AI engines read structure.
              </Check>
              <Check ok={post.summary.length >= 80}>
                Summary &gt; 80 chars makes a quotable answer.
              </Check>
              <Check ok={post.body.length >= 1500}>
                ≥ 1500 chars gives enough substance to cite.
              </Check>
              <Check ok={(post.seo.keywords?.length ?? 0) >= 3}>
                ≥ 3 keywords help topical clustering.
              </Check>
              <Check ok={!!post.coverImage}>
                Cover image set — used for OG + Twitter card.
              </Check>
            </ul>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        destructive
        title={`Delete "${post.title}"?`}
        description={
          <span>
            This is permanent. The post will disappear from{" "}
            <span className="font-mono">/blog</span> and any external links to{" "}
            <span className="font-mono">/blog/{initial?.slug}</span> will 404.
          </span>
        }
        confirmLabel="Delete forever"
        onConfirm={handleDelete}
      />
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Check({
  ok,
  children,
}: {
  ok: boolean
  children: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={cn(
          "mt-1 inline-block size-1.5 rounded-full",
          ok ? "bg-emerald-400" : "bg-muted-foreground/40"
        )}
      />
      <span className={cn(ok ? "text-foreground/80" : "text-muted-foreground")}>
        {children}
      </span>
    </li>
  )
}

function parseYoutube(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.endsWith("youtu.be")) {
      return u.pathname.replace(/^\//, "").split(/[?&]/)[0] || null
    }
    if (u.hostname.endsWith("youtube.com") || u.hostname.endsWith("youtube-nocookie.com")) {
      const v = u.searchParams.get("v")
      if (v) return v
      const m = /\/(?:embed|shorts)\/([A-Za-z0-9_-]{6,})/.exec(u.pathname)
      if (m) return m[1]!
    }
    return null
  } catch {
    return null
  }
}

function parseVimeo(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.endsWith("vimeo.com")) return null
    const m = /\/(\d+)/.exec(u.pathname)
    return m ? m[1]! : null
  } catch {
    return null
  }
}

function absUrl(maybeRelative: string): string {
  if (typeof window === "undefined") return maybeRelative
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative
  return new URL(maybeRelative, window.location.origin).toString()
}
