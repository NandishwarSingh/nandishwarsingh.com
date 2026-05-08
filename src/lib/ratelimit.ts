import "server-only"
import { rateLimits } from "./db"

export type RateLimitResult = {
  ok: boolean
  remaining: number
  resetAt: Date
}

/**
 * Soft IP-based rate limit backed by Mongo. Atomic increment with TTL on resetAt.
 *
 * Bucket keys are namespaced (e.g. "qr-create"). Each (bucket, ip) gets `limit`
 * actions per `windowMs`.
 */
export async function rateLimit(
  bucket: string,
  ip: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const coll = await rateLimits()
  const id = `${bucket}:${ip}`
  const now = new Date()
  const newReset = new Date(now.getTime() + windowMs)

  // 1) Try to take a slot in the current window.
  const inc = await coll.findOneAndUpdate(
    { _id: id, resetAt: { $gt: now } },
    { $inc: { count: 1 } },
    { returnDocument: "after" }
  )
  if (inc) {
    const remaining = Math.max(0, limit - inc.count)
    return {
      ok: inc.count <= limit,
      remaining,
      resetAt: inc.resetAt,
    }
  }

  // 2) Window expired (or no doc yet) — start a new window.
  await coll.updateOne(
    { _id: id },
    { $set: { count: 1, resetAt: newReset } },
    { upsert: true }
  )
  return {
    ok: true,
    remaining: limit - 1,
    resetAt: newReset,
  }
}

export function clientIp(req: Request): string {
  const h = req.headers
  const xff = h.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]!.trim()
  const real = h.get("x-real-ip")
  if (real) return real.trim()
  // Falls through to "unknown" when no proxy headers present (typical in dev).
  return "unknown"
}
