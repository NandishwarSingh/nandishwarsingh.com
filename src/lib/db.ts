import "server-only"
import { MongoClient, type Collection, type Db, type ObjectId } from "mongodb"

const URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017"
const DB_NAME = process.env.MONGODB_DB ?? "nandishwarsingh"

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined
}

function getClient(): Promise<MongoClient> {
  if (!global.__mongoClientPromise) {
    const client = new MongoClient(URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    })
    global.__mongoClientPromise = client.connect()
  }
  return global.__mongoClientPromise
}

export async function getDb(): Promise<Db> {
  const client = await getClient()
  return client.db(DB_NAME)
}

// === Collections ===

export type QrLink = {
  _id?: ObjectId
  slug: string
  targetUrl: string
  title: string
  style: Record<string, unknown>
  ownerKey: string
  createdAt: Date
  updatedAt: Date
  archived: boolean
}

export type QrClick = {
  _id?: ObjectId
  slug: string
  ts: Date
  ip: string
  ipHash: string
  country?: string
  region?: string
  city?: string
  ua: string
  device?: string
  os?: string
  browser?: string
  referrer?: string
  isUnique: boolean
}

export type RateLimitDoc = {
  _id: string // `${bucket}:${ip}`
  count: number
  resetAt: Date
}

export type PageView = {
  _id?: ObjectId
  sessionId: string
  path: string
  ts: Date
  durationMs: number
  endedAt?: Date
  ip: string
  ipHash: string
  country?: string
  region?: string
  city?: string
  ua: string
  device?: string
  os?: string
  browser?: string
  referrer?: string
  isBot: boolean
  botReason?: string
  isUnique: boolean
}

export type Post = {
  _id?: ObjectId
  slug: string
  title: string
  summary: string
  body: string
  coverImage?: string
  tags: string[]
  status: "draft" | "published"
  author: string
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  seo: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
    canonicalUrl?: string
    ogImage?: string
  }
  views: number
  /** Emoji → array of identity-token-hashes that reacted with it. */
  reactions?: Record<string, string[]>
}

export type AutoblogRun = {
  _id?: ObjectId
  startedAt: Date
  finishedAt?: Date
  source: "news" | "github" | "unknown"
  topic?: string
  candidateUrls: string[]
  imageUrls: string[]
  recencyCheck?: { ok: boolean; ageHours?: number | null; reason: string; raw?: string }
  dedupCheck?: { duplicate: boolean; mostSimilarSlug?: string | null; reason: string; raw?: string; comparedAgainst?: string[] }
  writer?: { model: string; tokens?: number }
  postSlug?: string
  status: "running" | "ok" | "skipped" | "error"
  skipReason?: "stale" | "duplicate" | "no-topic" | "no-content"
  errorMessage?: string
  /** Last raw payload from each step, capped, for debugging. */
  debug?: Record<string, string>
}

export type AutoblogLock = {
  _id: string // always "global"
  acquiredAt: Date
  expiresAt: Date
  runId?: ObjectId
}

export type Comment = {
  _id?: ObjectId
  postSlug: string
  parentId: ObjectId | null
  /** First ancestor; null for top-level. Lets us paginate per-thread later. */
  rootId: ObjectId | null
  depth: number
  body: string
  authorName: string
  /** sha256 of the commenter's localStorage identity token, sliced to 24 chars. */
  authorTokenHash: string
  /** md5 of lowercased trimmed email — used for gravatar avatar URL only. */
  authorEmailHash?: string
  createdAt: Date
  editedAt?: Date
  deleted: boolean
  reactions: Record<string, string[]>
  replyCount: number
  ipHash?: string
}

export type Session = {
  _id?: ObjectId
  sessionId: string
  startedAt: Date
  lastSeenAt: Date
  pageCount: number
  totalDurationMs: number
  ip: string
  ipHash: string
  country?: string
  ua: string
  device?: string
  os?: string
  browser?: string
  isBot: boolean
  firstPath: string
  lastPath: string
  referrer?: string
}

export async function qrLinks(): Promise<Collection<QrLink>> {
  const db = await getDb()
  return db.collection<QrLink>("qr_links")
}

export async function qrClicks(): Promise<Collection<QrClick>> {
  const db = await getDb()
  return db.collection<QrClick>("qr_clicks")
}

export async function rateLimits(): Promise<Collection<RateLimitDoc>> {
  const db = await getDb()
  return db.collection<RateLimitDoc>("ratelimits")
}

export async function pageViews(): Promise<Collection<PageView>> {
  const db = await getDb()
  return db.collection<PageView>("pageviews")
}

export async function sessions(): Promise<Collection<Session>> {
  const db = await getDb()
  return db.collection<Session>("sessions")
}

export async function posts(): Promise<Collection<Post>> {
  const db = await getDb()
  return db.collection<Post>("posts")
}

export async function comments(): Promise<Collection<Comment>> {
  const db = await getDb()
  return db.collection<Comment>("comments")
}

export async function autoblogRuns(): Promise<Collection<AutoblogRun>> {
  const db = await getDb()
  return db.collection<AutoblogRun>("autoblog_runs")
}

export async function autoblogLocks(): Promise<Collection<AutoblogLock>> {
  const db = await getDb()
  return db.collection<AutoblogLock>("autoblog_locks")
}

let indexesEnsured = false

export async function ensureIndexes() {
  if (indexesEnsured) return
  indexesEnsured = true
  try {
    const links = await qrLinks()
    const clicks = await qrClicks()
    const rl = await rateLimits()
    const pv = await pageViews()
    const ss = await sessions()
    await Promise.all([
      links.createIndex({ slug: 1 }, { unique: true }),
      links.createIndex({ ownerKey: 1 }),
      links.createIndex({ createdAt: -1 }),
      clicks.createIndex({ slug: 1, ts: -1 }),
      clicks.createIndex({ slug: 1, ipHash: 1 }),
      rl.createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 }),
      pv.createIndex({ ts: -1 }),
      pv.createIndex({ sessionId: 1, ts: -1 }),
      pv.createIndex({ path: 1, ts: -1 }),
      pv.createIndex({ isBot: 1, ts: -1 }),
      ss.createIndex({ sessionId: 1 }, { unique: true }),
      ss.createIndex({ lastSeenAt: -1 }),
      ss.createIndex({ isBot: 1, startedAt: -1 }),
    ])
    const ps = await posts()
    const cm = await comments()
    await Promise.all([
      ps.createIndex({ slug: 1 }, { unique: true }),
      ps.createIndex({ status: 1, publishedAt: -1 }),
      ps.createIndex({ tags: 1 }),
      cm.createIndex({ postSlug: 1, createdAt: -1 }),
      cm.createIndex({ postSlug: 1, parentId: 1, createdAt: 1 }),
      cm.createIndex({ authorTokenHash: 1, createdAt: -1 }),
    ])
    const runs = await autoblogRuns()
    const locks = await autoblogLocks()
    await Promise.all([
      runs.createIndex({ startedAt: -1 }),
      runs.createIndex({ status: 1, startedAt: -1 }),
      locks.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ])
  } catch {
    // Don't crash a request if index creation races; will retry next call.
    indexesEnsured = false
  }
}
