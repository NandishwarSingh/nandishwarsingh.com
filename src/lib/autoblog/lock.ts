import { autoblogLocks } from "@/lib/db"
import { AUTOBLOG } from "./config"

export async function acquireLock(): Promise<boolean> {
  const col = await autoblogLocks()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + AUTOBLOG.limits.lockTtlMinutes * 60_000)
  try {
    const res = await col.updateOne(
      { _id: "global", expiresAt: { $lt: now } },
      { $set: { _id: "global", acquiredAt: now, expiresAt } },
      { upsert: true }
    )
    return res.upsertedCount > 0 || res.modifiedCount > 0
  } catch {
    return false
  }
}

export async function releaseLock(): Promise<void> {
  const col = await autoblogLocks()
  await col.deleteOne({ _id: "global" }).catch(() => {})
}
