// Live bridge to the running nDB instance. Server-side only (uses node:net).
import { NextResponse } from "next/server"
import {
  ndbGet,
  ndbStats,
  ndbQuery,
  ndbBench,
  ndbBenchWrite,
  ndbBenchMixed,
} from "@/lib/ndb"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

const PREFIXES = ["user", "event", "order", "metric", "session"]

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}

function parseFlat(raw: unknown): Record<string, string> | null {
  if (typeof raw !== "string" || !raw.includes("=")) return null
  const obj: Record<string, string> = {}
  for (const pair of raw.split("|")) {
    const eq = pair.indexOf("=")
    if (eq > 0) obj[pair.slice(0, eq)] = pair.slice(eq + 1)
  }
  return obj
}

export async function GET(req: Request) {
  const u = new URL(req.url)
  const op = u.searchParams.get("op") || "stats"

  try {
    if (op === "stats") {
      return json({ ok: true, stats: await ndbStats() })
    }

    if (op === "row") {
      const key = u.searchParams.get("key") || ""
      if (!key) return json({ ok: false, error: "key required" }, 400)
      const { result, rttUs } = await ndbGet(key.slice(0, 256))
      const raw = result?.value
      return json({
        ok: true,
        key,
        found: result?.status === "ok" && !!raw,
        value: raw ?? null,
        parsed: parseFlat(raw),
        rttUs: Math.round(rttUs),
      })
    }

    if (op === "rows") {
      const prefix = (u.searchParams.get("prefix") || "user").toLowerCase()
      if (!PREFIXES.includes(prefix))
        return json({ ok: false, error: "bad prefix" }, 400)
      const n = Math.max(1, Math.min(Number(u.searchParams.get("n") || 12), 50))
      const start = Math.max(1, Number(u.searchParams.get("start") || 1))
      const out: { key: string; value: Record<string, string>; rttUs: number }[] = []
      for (let i = start; i < start + n; i++) {
        const key = `${prefix}:${i}`
        try {
          const { result, rttUs } = await ndbGet(key)
          const parsed = parseFlat(result?.value)
          if (parsed) out.push({ key, value: parsed, rttUs: Math.round(rttUs) })
        } catch {
          /* skip */
        }
      }
      return json({ ok: true, prefix, rows: out })
    }

    if (op === "query") {
      const sql = (u.searchParams.get("sql") || "").trim()
      if (!/^select\b/i.test(sql))
        return json({ ok: false, error: "Only SELECT is allowed." }, 400)
      const { result, rttUs } = await ndbQuery(sql.slice(0, 400))
      return json({ ok: true, sql, result, rttUs: Math.round(rttUs) })
    }

    if (op === "bench") {
      const n = Math.max(50, Math.min(Number(u.searchParams.get("n") || 800), 100000))
      return json({ ok: true, bench: await ndbBench(n, PREFIXES) })
    }
    if (op === "benchwrite") {
      const n = Math.max(50, Math.min(Number(u.searchParams.get("n") || 800), 100000))
      return json({ ok: true, bench: await ndbBenchWrite(n) })
    }
    if (op === "benchmix") {
      const n = Math.max(50, Math.min(Number(u.searchParams.get("n") || 800), 100000))
      return json({ ok: true, bench: await ndbBenchMixed(n, PREFIXES) })
    }

    return json({ ok: false, error: "unknown op" }, 400)
  } catch (e) {
    return json(
      { ok: false, error: e instanceof Error ? e.message : "nDB unreachable" },
      502
    )
  }
}
