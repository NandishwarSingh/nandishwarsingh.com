/**
 * Weekly autoblog orchestrator.
 *
 * Pulls the past 7 days of GitHub activity for `GITHUB_USERNAME`, picks the
 * top N most-active repos, and writes one blog post per repo via the
 * single-post pipeline. Holds one outer lock around the whole run so only
 * one weekly job can execute at a time.
 */
import { autoblogRuns, posts as postsCollection } from "@/lib/db"
import { runAutoblog, type RunResult } from "./pipeline"
import {
  formatActivityForPrompt,
  getWeeklyActivity,
  topicFromActivity,
  type RepoActivity,
} from "./githubActivity"
import { acquireLock, releaseLock } from "./lock"
import { AUTOBLOG } from "./config"

export type WeeklyResult = {
  ok: boolean
  generated: number
  skipped: number
  reason?: string
  posts: Array<{ topic: string; result: RunResult }>
}

const DEFAULT_USERNAME = "NandishwarSingh"
const DEFAULT_POST_COUNT = 3

export async function runWeeklyAutoblog(opts?: {
  username?: string
  postCount?: number
  daysBack?: number
}): Promise<WeeklyResult> {
  const username = opts?.username ?? process.env.GITHUB_USERNAME ?? DEFAULT_USERNAME
  const postCount = opts?.postCount ?? Number(process.env.WEEKLY_POST_COUNT ?? DEFAULT_POST_COUNT)
  const daysBack = opts?.daysBack ?? 7

  const got = await acquireLock()
  if (!got) {
    return {
      ok: false,
      generated: 0,
      skipped: 0,
      reason: "another autoblog run is in flight",
      posts: [],
    }
  }

  // Log a synthetic "weekly orchestrator" run so it's visible in /admin/autoblog
  // alongside individual post runs.
  const runs = await autoblogRuns()
  const weeklyRun = await runs.insertOne({
    startedAt: new Date(),
    source: "github",
    candidateUrls: [],
    imageUrls: [],
    status: "running",
    topic: `weekly run for ${username} (last ${daysBack}d, target ${postCount} posts)`,
  })

  try {
    const activity = await getWeeklyActivity(username, daysBack)

    if (activity.length === 0) {
      await runs.updateOne(
        { _id: weeklyRun.insertedId },
        {
          $set: {
            finishedAt: new Date(),
            status: "skipped",
            skipReason: "no-topic",
            errorMessage: `No GitHub activity for ${username} in the last ${daysBack} days`,
          },
        }
      )
      return {
        ok: false,
        generated: 0,
        skipped: 0,
        reason: `no GitHub activity in last ${daysBack}d`,
        posts: [],
      }
    }

    // Pick top N by importance — already sorted by getWeeklyActivity.
    const winners: RepoActivity[] = activity.slice(0, postCount)

    const posts: WeeklyResult["posts"] = []
    let generated = 0
    let skipped = 0

    const ps = await postsCollection()
    const cooldownMs = AUTOBLOG.limits.repoCooldownDays * 24 * 60 * 60 * 1000
    const cooldownSince = new Date(Date.now() - cooldownMs)

    for (const a of winners) {
      // Skip a repo if it already has an autoblog post inside the cooldown
      // window — stops near-duplicate "this week in <repo>" articles.
      const recentForRepo = await ps.findOne(
        { sourceRepo: a.repo, createdAt: { $gte: cooldownSince } },
        { projection: { _id: 1 } }
      )
      if (recentForRepo) {
        posts.push({
          topic: topicFromActivity(a),
          result: {
            ok: false,
            runId: "",
            reason: `skipped: ${a.repo} blogged within ${AUTOBLOG.limits.repoCooldownDays}d`,
          },
        })
        skipped += 1
        continue
      }
      const topic = topicFromActivity(a)
      const context = formatActivityForPrompt(a)
      const result = await runAutoblog({
        topic,
        contextSummary: context,
        skipLock: true, // we already hold the outer lock
        sourceRepo: a.repo,
      })
      posts.push({ topic, result })
      if (result.ok) generated += 1
      else skipped += 1

      // Small breather between writer calls so we don't hammer OpenRouter.
      await new Promise((r) => setTimeout(r, 1000))
    }

    await runs.updateOne(
      { _id: weeklyRun.insertedId },
      {
        $set: {
          finishedAt: new Date(),
          status: generated > 0 ? "ok" : "error",
          postSlug: posts.find((p) => p.result.ok && "postSlug" in p.result)
            ? (posts.find((p) => p.result.ok && "postSlug" in p.result)!.result as { postSlug: string }).postSlug
            : undefined,
          writer: { model: AUTOBLOG.models.writer },
        },
      }
    )

    return { ok: generated > 0, generated, skipped, posts }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await runs.updateOne(
      { _id: weeklyRun.insertedId },
      {
        $set: {
          finishedAt: new Date(),
          status: "error",
          errorMessage: msg,
        },
      }
    )
    return {
      ok: false,
      generated: 0,
      skipped: 0,
      reason: msg,
      posts: [],
    }
  } finally {
    await releaseLock()
  }
}
