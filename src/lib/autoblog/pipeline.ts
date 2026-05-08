import { ObjectId } from "mongodb"
import { autoblogRuns, posts, type AutoblogRun, type Post } from "@/lib/db"
import { slugify, SLUG_RE } from "@/lib/posts"
import { pingIndexNow } from "@/lib/indexnow"
import { SITE } from "@/lib/site"
import { AUTOBLOG, TOPIC_POOL } from "./config"
import { callChat, extractText } from "./openrouter"
import { acquireLock, releaseLock } from "./lock"

export type RunResult =
  | { ok: true; runId: string; postSlug: string }
  | { ok: false; runId: string; reason: string }

const SYSTEM_PROMPT = `You are Nandishwar Singh writing a long-form post on his personal engineering blog. Builder voice — direct, opinionated, specific. No corporate fluff, no filler intros. Concrete examples and code snippets where they help. Markdown only. Length: 1500-2500 words.`

const WRITER_USER_TEMPLATE = (topic: string) =>
  `Write a blog post on this topic: "${topic}"

Output strict JSON only with this exact shape (no prose, no code fences around the JSON):

{
  "title": "<short headline, <= 70 chars>",
  "slug": "<kebab-case slug, no leading/trailing dashes>",
  "summary": "<2-3 sentence TL;DR, <= 220 chars>",
  "tags": ["<3 to 6 tags, lowercase, no spaces>"],
  "body": "<markdown body, 1500-2500 words, with sections and code>"
}`

function safeJsonParse(s: string): Record<string, unknown> | null {
  const cleaned = s.replace(/^```(?:json)?\s*|```\s*$/g, "").trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    // Fall through to the brace-balanced extractor below.
  }
  // Free tier models often wrap JSON in prose. Find the first { and balance braces.
  const start = cleaned.indexOf("{")
  if (start < 0) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (esc) {
      esc = false
      continue
    }
    if (ch === "\\") {
      esc = true
      continue
    }
    if (ch === '"') {
      inStr = !inStr
      continue
    }
    if (inStr) continue
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) {
        const slice = cleaned.slice(start, i + 1)
        try {
          return JSON.parse(slice)
        } catch {
          return null
        }
      }
    }
  }
  return null
}

async function pickTopic(recentTitles: string[]): Promise<string | null> {
  const recent = new Set(recentTitles.map((t) => t.toLowerCase()))
  const candidates = TOPIC_POOL.filter(
    (t) => !Array.from(recent).some((r) => r.includes(t.toLowerCase().slice(0, 30)))
  )
  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export async function runAutoblog(): Promise<RunResult> {
  const runs = await autoblogRuns()
  const ps = await posts()

  const got = await acquireLock()
  if (!got) {
    const r = await runs.insertOne({
      startedAt: new Date(),
      finishedAt: new Date(),
      source: "unknown",
      candidateUrls: [],
      imageUrls: [],
      status: "skipped",
      skipReason: "no-topic",
      errorMessage: "Another run is in flight",
    } satisfies AutoblogRun)
    return { ok: false, runId: r.insertedId.toString(), reason: "locked" }
  }

  const startedAt = new Date()
  const runDoc: AutoblogRun = {
    startedAt,
    source: "unknown",
    candidateUrls: [],
    imageUrls: [],
    status: "running",
  }
  const ins = await runs.insertOne(runDoc)
  const runId = ins.insertedId

  try {
    const sinceDate = new Date(
      Date.now() - AUTOBLOG.limits.dedupWindowDays * 24 * 60 * 60 * 1000
    )
    const recent = await ps
      .find(
        { publishedAt: { $gte: sinceDate } },
        { projection: { title: 1, slug: 1 } }
      )
      .limit(60)
      .toArray()

    const topic = await pickTopic(recent.map((p) => p.title))
    if (!topic) {
      await runs.updateOne(
        { _id: runId },
        {
          $set: {
            finishedAt: new Date(),
            status: "skipped",
            skipReason: "no-topic",
            topic: undefined,
          },
        }
      )
      return { ok: false, runId: runId.toString(), reason: "all topics covered recently" }
    }

    const writerResp = await callChat({
      model: AUTOBLOG.models.writer,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: WRITER_USER_TEMPLATE(topic) },
      ],
      max_tokens: AUTOBLOG.limits.writerMaxOutputTokens,
      temperature: 0.7,
      response_format: { type: "json_object" },
    })

    const raw = extractText(writerResp)
    const parsed = safeJsonParse(raw)
    if (
      !parsed ||
      typeof parsed.title !== "string" ||
      typeof parsed.body !== "string" ||
      parsed.body.length < 400
    ) {
      await runs.updateOne(
        { _id: runId },
        {
          $set: {
            finishedAt: new Date(),
            status: "error",
            topic,
            errorMessage: "Writer output was not valid JSON or too short",
            debug: { writerRaw: raw.slice(0, 4000) },
          },
        }
      )
      return { ok: false, runId: runId.toString(), reason: "invalid writer output" }
    }

    const title = (parsed.title as string).slice(0, 110).trim()
    const summary = (
      typeof parsed.summary === "string" ? parsed.summary : title
    )
      .slice(0, 220)
      .trim()
    const tags = Array.isArray(parsed.tags)
      ? (parsed.tags as unknown[])
          .filter((x): x is string => typeof x === "string")
          .map((t) => t.toLowerCase().trim().replace(/\s+/g, "-"))
          .filter((t) => /^[a-z0-9][a-z0-9-]{0,40}$/.test(t))
          .slice(0, 6)
      : []

    let slug =
      typeof parsed.slug === "string" && SLUG_RE.test(parsed.slug)
        ? parsed.slug
        : slugify(title)

    let attempt = 1
    let candidate = slug
    while (await ps.findOne({ slug: candidate }, { projection: { _id: 1 } })) {
      attempt += 1
      candidate = `${slug}-${attempt}`
      if (attempt > 50) break
    }
    slug = candidate

    const now = new Date()
    const status = AUTOBLOG.defaultStatus
    const post: Post = {
      slug,
      title,
      summary,
      body: parsed.body as string,
      tags,
      status,
      author: process.env.SITE_AUTHOR ?? "Nandishwar Singh",
      publishedAt: status === "published" ? now : undefined,
      createdAt: now,
      updatedAt: now,
      seo: { keywords: tags },
      views: 0,
    }
    await ps.insertOne(post)

    if (status === "published") {
      void pingIndexNow([
        `${SITE.origin}/blog/${slug}`,
        `${SITE.origin}/blog`,
        `${SITE.origin}/sitemap.xml`,
      ]).catch(() => {})
    }

    await runs.updateOne(
      { _id: runId },
      {
        $set: {
          finishedAt: new Date(),
          status: "ok",
          topic,
          postSlug: slug,
          writer: {
            model: writerResp.model ?? AUTOBLOG.models.writer,
            tokens: writerResp.usage?.total_tokens,
          },
        },
      }
    )

    return { ok: true, runId: runId.toString(), postSlug: slug }
  } catch (err) {
    await runs.updateOne(
      { _id: runId },
      {
        $set: {
          finishedAt: new Date(),
          status: "error",
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      }
    )
    return {
      ok: false,
      runId: runId.toString(),
      reason: err instanceof Error ? err.message : "unknown error",
    }
  } finally {
    await releaseLock()
  }
}

export async function listRuns(limit = 25) {
  const runs = await autoblogRuns()
  const docs = await runs
    .find({}, { projection: { debug: 0 } })
    .sort({ startedAt: -1 })
    .limit(limit)
    .toArray()
  return docs.map((d) => ({
    id: (d._id as ObjectId).toString(),
    startedAt: d.startedAt,
    finishedAt: d.finishedAt,
    source: d.source,
    topic: d.topic,
    postSlug: d.postSlug,
    status: d.status,
    skipReason: d.skipReason,
    errorMessage: d.errorMessage,
    writer: d.writer,
    recencyCheck: d.recencyCheck,
    dedupCheck: d.dedupCheck,
  }))
}
