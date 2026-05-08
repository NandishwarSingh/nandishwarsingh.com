import type { NextRequest } from "next/server"
import { ensureIndexes, pageViews, sessions } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RANGES = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  all: Number.POSITIVE_INFINITY,
} as const

type RangeKey = keyof typeof RANGES

function rangeStart(key: RangeKey): Date | null {
  const ms = RANGES[key]
  if (!Number.isFinite(ms)) return null
  return new Date(Date.now() - ms)
}

function dayBucketFormat(key: RangeKey): string {
  return key === "24h" ? "%Y-%m-%dT%H:00:00Z" : "%Y-%m-%d"
}

export async function GET(request: NextRequest) {
  const rangeParam = request.nextUrl.searchParams.get("range") ?? "7d"
  const range: RangeKey =
    rangeParam in RANGES ? (rangeParam as RangeKey) : "7d"
  const includeBots =
    request.nextUrl.searchParams.get("bots") === "1"

  await ensureIndexes()
  const pv = await pageViews()
  const ss = await sessions()

  const since = rangeStart(range)
  const matchPv: Record<string, unknown> = includeBots ? {} : { isBot: false }
  const matchSs: Record<string, unknown> = includeBots ? {} : { isBot: false }
  if (since) {
    matchPv.ts = { $gte: since }
    matchSs.startedAt = { $gte: since }
  }

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)

  const [
    totalViews,
    totalSessions,
    sessionAgg,
    timeseries,
    countries,
    paths,
    devices,
    osBreakdown,
    browsers,
    activeNow,
    botCount,
    recent,
  ] = await Promise.all([
    pv.countDocuments(matchPv),
    ss.countDocuments(matchSs),
    ss
      .aggregate<{
        sessions: number
        bouncedSessions: number
        avgPagesPerSession: number
        avgDurationMs: number
      }>([
        { $match: matchSs },
        {
          $group: {
            _id: null,
            sessions: { $sum: 1 },
            bouncedSessions: {
              $sum: { $cond: [{ $lte: ["$pageCount", 1] }, 1, 0] },
            },
            avgPagesPerSession: { $avg: "$pageCount" },
            avgDurationMs: { $avg: "$totalDurationMs" },
          },
        },
        { $project: { _id: 0 } },
      ])
      .next(),
    pv
      .aggregate([
        { $match: matchPv },
        {
          $group: {
            _id: {
              $dateToString: {
                format: dayBucketFormat(range),
                date: "$ts",
              },
            },
            views: { $sum: 1 },
            sessions: { $addToSet: "$sessionId" },
          },
        },
        {
          $project: {
            _id: 0,
            bucket: "$_id",
            views: 1,
            sessions: { $size: "$sessions" },
          },
        },
        { $sort: { bucket: 1 } },
      ])
      .toArray(),
    pv
      .aggregate([
        { $match: matchPv },
        {
          $group: {
            _id: { $ifNull: ["$country", "—"] },
            views: { $sum: 1 },
            sessions: { $addToSet: "$sessionId" },
          },
        },
        {
          $project: {
            _id: 0,
            country: "$_id",
            views: 1,
            sessions: { $size: "$sessions" },
          },
        },
        { $sort: { views: -1 } },
        { $limit: 16 },
      ])
      .toArray(),
    pv
      .aggregate([
        { $match: matchPv },
        {
          $group: {
            _id: "$path",
            views: { $sum: 1 },
            sessions: { $addToSet: "$sessionId" },
            avgDurationMs: { $avg: "$durationMs" },
          },
        },
        {
          $project: {
            _id: 0,
            path: "$_id",
            views: 1,
            sessions: { $size: "$sessions" },
            avgDurationMs: 1,
          },
        },
        { $sort: { views: -1 } },
        { $limit: 16 },
      ])
      .toArray(),
    pv
      .aggregate([
        { $match: matchPv },
        {
          $group: {
            _id: { $ifNull: ["$device", "Other"] },
            views: { $sum: 1 },
          },
        },
        { $project: { _id: 0, device: "$_id", views: 1 } },
        { $sort: { views: -1 } },
      ])
      .toArray(),
    pv
      .aggregate([
        { $match: matchPv },
        {
          $group: {
            _id: { $ifNull: ["$os", "Other"] },
            views: { $sum: 1 },
          },
        },
        { $project: { _id: 0, os: "$_id", views: 1 } },
        { $sort: { views: -1 } },
        { $limit: 8 },
      ])
      .toArray(),
    pv
      .aggregate([
        { $match: matchPv },
        {
          $group: {
            _id: { $ifNull: ["$browser", "Other"] },
            views: { $sum: 1 },
          },
        },
        { $project: { _id: 0, browser: "$_id", views: 1 } },
        { $sort: { views: -1 } },
        { $limit: 8 },
      ])
      .toArray(),
    ss
      .aggregate<{ active: number }>([
        { $match: { lastSeenAt: { $gte: fiveMinAgo }, isBot: false } },
        { $count: "active" },
      ])
      .next(),
    pv.countDocuments(
      since ? { isBot: true, ts: { $gte: since } } : { isBot: true }
    ),
    pv
      .find(matchPv, {
        projection: { _id: 0, ip: 0, ipHash: 0 },
      })
      .sort({ ts: -1 })
      .limit(40)
      .toArray(),
  ])

  const sessionsTotal = sessionAgg?.sessions ?? 0
  const bounced = sessionAgg?.bouncedSessions ?? 0
  const bounceRate = sessionsTotal > 0 ? bounced / sessionsTotal : 0
  const avgDurationMs = sessionAgg?.avgDurationMs ?? 0
  const avgPagesPerSession = sessionAgg?.avgPagesPerSession ?? 0

  return Response.json({
    range,
    includeBots,
    summary: {
      views: totalViews,
      sessions: totalSessions,
      bouncedSessions: bounced,
      bounceRate,
      avgDurationMs,
      avgPagesPerSession,
      activeNow: activeNow?.active ?? 0,
      botsFiltered: botCount,
    },
    timeseries,
    countries,
    paths,
    devices,
    osBreakdown,
    browsers,
    recent,
  })
}
