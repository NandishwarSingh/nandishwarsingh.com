/**
 * Pulls public GitHub activity for a user over the past N days and groups it
 * into per-repo summaries that can be turned into blog topics.
 *
 * Uses unauthenticated REST endpoints (60 req/hr — fine for a weekly run).
 * If GITHUB_TOKEN is set in the environment we send it as Bearer to lift the
 * rate cap and unlock private-repo events.
 */

const GITHUB_API = "https://api.github.com"

type GitHubEvent = {
  id: string
  type: string
  created_at: string
  repo: { name: string; url: string }
  payload: Record<string, unknown>
  public: boolean
}

type CommitInfo = {
  sha: string
  message: string
  url: string
  date: string
}

export type RepoActivity = {
  repo: string                  // "owner/name"
  url: string                   // https url to repo
  description: string | null
  language: string | null
  stars: number
  pushes: number                // # of PushEvents observed
  prsOpened: number
  prsMerged: number
  issuesOpened: number
  releases: number
  commits: CommitInfo[]
  firstActivityAt: string
  lastActivityAt: string
  /** true when the repo is a fork of someone else's project. */
  isFork: boolean
}

function ghHeaders(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "nandishwarsingh.com-autoblog",
  }
  const token = process.env.GITHUB_TOKEN
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

class GitHubFetchError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * GET JSON with retries. Returns parsed body, or null only for a genuine
 * 404 (resource really absent). Transient failures (5xx, 429, 403
 * rate-limit, network) are retried with exponential backoff; if they
 * persist, throws GitHubFetchError so the caller does NOT mistake a broken
 * API for "no activity".
 */
async function getJson<T>(url: string): Promise<T | null> {
  const MAX = 4
  let lastStatus = 0
  for (let attempt = 1; attempt <= MAX; attempt++) {
    try {
      const res = await fetch(url, { headers: ghHeaders(), cache: "no-store" })
      if (res.ok) return (await res.json()) as T
      lastStatus = res.status
      if (res.status === 404) return null // genuinely absent
      // 403 (rate-limit/abuse), 429, 5xx -> retryable
    } catch {
      lastStatus = -1 // network error -> retryable
    }
    if (attempt < MAX) await sleep(1000 * 2 ** (attempt - 1)) // 1s,2s,4s
  }
  throw new GitHubFetchError(
    `GitHub API failed after ${MAX} attempts (last status ${lastStatus}): ${url}`
  )
}

/**
 * Fetch up to 300 most-recent public events for a user (3 pages × 100).
 * Filter to events newer than `sinceMs`.
 */
async function fetchEvents(username: string, sinceMs: number): Promise<GitHubEvent[]> {
  const out: GitHubEvent[] = []
  for (let page = 1; page <= 3; page++) {
    const url = `${GITHUB_API}/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`
    // getJson throws (not returns null) on persistent API failure, so a
    // transient GitHub outage propagates instead of looking like "no events".
    const batch = await getJson<GitHubEvent[]>(url)
    if (!batch || batch.length === 0) break
    let stop = false
    for (const ev of batch) {
      const ts = new Date(ev.created_at).getTime()
      if (ts < sinceMs) {
        stop = true
        break
      }
      out.push(ev)
    }
    if (stop) break
  }
  return out
}

type RepoMeta = {
  description: string | null
  language: string | null
  stars: number
  fork: boolean
}

async function fetchRepoMeta(repoFullName: string): Promise<RepoMeta> {
  const data = await getJson<{
    description: string | null
    language: string | null
    stargazers_count: number
    fork: boolean
  }>(`${GITHUB_API}/repos/${repoFullName}`)
  return {
    description: data?.description ?? null,
    language: data?.language ?? null,
    stars: data?.stargazers_count ?? 0,
    fork: data?.fork ?? false,
  }
}

async function fetchAuthorCommits(
  repoFullName: string,
  username: string,
  sinceISO: string
): Promise<CommitInfo[]> {
  const url = `${GITHUB_API}/repos/${repoFullName}/commits?author=${encodeURIComponent(
    username
  )}&since=${encodeURIComponent(sinceISO)}&per_page=50`
  type Raw = Array<{
    sha: string
    html_url: string
    commit: { message: string; author: { date: string } }
  }>
  const map = (data: Raw) =>
    data.map((c) => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split("\n")[0].slice(0, 200),
      url: c.html_url,
      date: c.commit.author.date,
    }))

  const byAuthor = await getJson<Raw>(url)
  if (byAuthor && byAuthor.length > 0) return map(byAuthor)

  // GitHub's ?author= + since filter misses commits on some repos (default
  // branch / attribution quirk) even when the events feed shows many
  // pushes. Fall back to the unfiltered commit list for the same window so
  // the prompt still gets real subject lines. For a personal repo these are
  // overwhelmingly the user's own commits.
  const fallbackUrl = `${GITHUB_API}/repos/${repoFullName}/commits?since=${encodeURIComponent(
    sinceISO
  )}&per_page=50`
  const all = await getJson<Raw>(fallbackUrl)
  return all ? map(all) : []
}

/**
 * Build per-repo activity rollups for a user over the past `days` days.
 * Returns repos with activity, sorted by descending importance (commits +
 * PRs + releases). Empty array if the user did nothing.
 */
export async function getWeeklyActivity(
  username: string,
  days = 7
): Promise<RepoActivity[]> {
  const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000
  const sinceISO = new Date(sinceMs).toISOString()

  const events = await fetchEvents(username, sinceMs)
  if (events.length === 0) return []

  const buckets = new Map<string, RepoActivity>()
  for (const ev of events) {
    const repo = ev.repo.name
    let b = buckets.get(repo)
    if (!b) {
      b = {
        repo,
        url: `https://github.com/${repo}`,
        description: null,
        language: null,
        stars: 0,
        pushes: 0,
        prsOpened: 0,
        prsMerged: 0,
        issuesOpened: 0,
        releases: 0,
        commits: [],
        firstActivityAt: ev.created_at,
        lastActivityAt: ev.created_at,
        isFork: false,
      }
      buckets.set(repo, b)
    }
    if (ev.created_at < b.firstActivityAt) b.firstActivityAt = ev.created_at
    if (ev.created_at > b.lastActivityAt) b.lastActivityAt = ev.created_at

    switch (ev.type) {
      case "PushEvent":
        b.pushes += 1
        break
      case "PullRequestEvent": {
        const action = (ev.payload as { action?: string }).action
        const merged = (
          ev.payload as { pull_request?: { merged?: boolean } }
        ).pull_request?.merged
        if (action === "opened") b.prsOpened += 1
        if (action === "closed" && merged) b.prsMerged += 1
        break
      }
      case "IssuesEvent": {
        const action = (ev.payload as { action?: string }).action
        if (action === "opened") b.issuesOpened += 1
        break
      }
      case "ReleaseEvent":
        b.releases += 1
        break
    }
  }

  // Pull repo metadata + author commits in parallel for each touched repo.
  const enriched = await Promise.all(
    Array.from(buckets.values()).map(async (b) => {
      const [meta, commits] = await Promise.all([
        fetchRepoMeta(b.repo),
        fetchAuthorCommits(b.repo, username, sinceISO),
      ])
      b.description = meta.description
      b.language = meta.language
      b.stars = meta.stars
      b.isFork = meta.fork
      b.commits = commits
      return b
    })
  )

  // Drop repos that ended up with no concrete commits AND no PRs/releases —
  // those are usually noise (starring, forking) we don't want to write about.
  return enriched
    .filter(
      (r) =>
        !r.isFork && // never blog forked repos — not the user's own project
        (r.commits.length > 0 ||
          r.pushes > 0 ||
          r.prsMerged > 0 ||
          r.releases > 0)
    )
    .sort((a, b) => {
      const aw =
        Math.max(a.commits.length, a.pushes) + a.prsMerged * 3 + a.releases * 5
      const bw =
        Math.max(b.commits.length, b.pushes) + b.prsMerged * 3 + b.releases * 5
      return bw - aw
    })
}

/**
 * Render a repo activity into a compact text block the LLM can ingest.
 * Concrete > abstract: include commit subject lines and counts so the model
 * can ground the post in real facts.
 */
export function formatActivityForPrompt(a: RepoActivity): string {
  const lines: string[] = []
  lines.push(`Repository: ${a.repo}`)
  if (a.description) lines.push(`Description: ${a.description}`)
  if (a.language) lines.push(`Primary language: ${a.language}`)
  lines.push(`Stars: ${a.stars}`)
  lines.push(
    `Activity: ${a.commits.length} commit(s), ${a.prsOpened} PR(s) opened, ${a.prsMerged} PR(s) merged, ${a.releases} release(s), ${a.issuesOpened} issue(s) opened`
  )
  if (a.commits.length > 0) {
    lines.push("")
    lines.push("Commit subject lines (most recent first):")
    for (const c of a.commits.slice(0, 25)) {
      lines.push(`  - ${c.message}`)
    }
  }
  return lines.join("\n")
}

/**
 * Pick a strong, blog-worthy topic title for one repo's week of activity.
 * Heuristic: builder-voice headlines that read like Hacker News titles.
 */
export function topicFromActivity(a: RepoActivity): string {
  const projectName = a.repo.split("/").pop() ?? a.repo
  const verbs = a.releases > 0 ? "Shipped" : a.prsMerged > 0 ? "Landed" : "Built"
  const desc = a.description ? ` (${a.description.slice(0, 80)})` : ""
  return `${verbs} this week in ${projectName}${desc}`
}
