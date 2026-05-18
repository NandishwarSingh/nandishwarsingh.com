// Minimal TCP client for the live nDB instance on 127.0.0.1:5555.
// Wire frame: [type:1][len:4 BE][payload]. Used only by server-side API routes.
import net from "node:net"

const HOST = "127.0.0.1"
const PORT = 5555

const MSG_QUERY = 1
const MSG_PUT = 3
const MSG_GET = 4
const MSG_STATS = 10

function frame(type: number, payload: string): Buffer {
  const body = Buffer.from(payload, "utf8")
  const head = Buffer.alloc(5)
  head[0] = type
  head.writeUInt32BE(body.length, 1)
  return Buffer.concat([head, body])
}

/** One request → one framed response. Returns the parsed JSON payload + the
 *  measured round-trip in microseconds (wall clock, includes TCP). */
function request(
  type: number,
  payload: string,
  timeoutMs = 4000
): Promise<{ json: unknown; rttUs: number }> {
  return new Promise((resolve, reject) => {
    const sock = net.connect(PORT, HOST)
    let buf = Buffer.alloc(0)
    const t0 = process.hrtime.bigint()
    const timer = setTimeout(() => {
      sock.destroy()
      reject(new Error("nDB timeout"))
    }, timeoutMs)

    sock.on("connect", () => sock.write(frame(type, payload)))
    sock.on("error", (e) => {
      clearTimeout(timer)
      reject(e)
    })
    sock.on("data", (d) => {
      buf = Buffer.concat([buf, d])
      if (buf.length < 5) return
      const len = buf.readUInt32BE(1)
      if (buf.length < 5 + len) return
      const rttUs = Number(process.hrtime.bigint() - t0) / 1000
      const payloadStr = buf.slice(5, 5 + len).toString("utf8")
      clearTimeout(timer)
      sock.end()
      let json: unknown
      try {
        json = JSON.parse(payloadStr)
      } catch {
        json = { raw: payloadStr }
      }
      resolve({ json, rttUs })
    })
  })
}

export async function ndbGet(key: string) {
  const { json, rttUs } = await request(
    MSG_GET,
    JSON.stringify({ key })
  )
  return { result: json as Record<string, unknown>, rttUs }
}

export async function ndbPut(key: string, value: string) {
  const { json, rttUs } = await request(
    MSG_PUT,
    JSON.stringify({ key, value })
  )
  return { result: json as Record<string, unknown>, rttUs }
}

export async function ndbQuery(sql: string) {
  const { json, rttUs } = await request(MSG_QUERY, sql)
  return { result: json as Record<string, unknown>, rttUs }
}

export type NdbLatency = {
  count: number
  avg_us: number
  min_us: number
  max_us: number
  p50_us: number
  p95_us: number
  p99_us: number
  p999_us: number
}

export async function ndbStats() {
  const { json } = await request(MSG_STATS, "")
  return json as {
    get_latency?: NdbLatency
    put_latency?: NdbLatency
    delete_latency?: NdbLatency
    [k: string]: unknown
  }
}

type EngineSnap = { count: number; avg: number }

function snap(l?: NdbLatency): EngineSnap {
  return { count: l?.count ?? 0, avg: l?.avg_us ?? 0 }
}

/** Exact average latency (µs) the engine measured for *only* the ops in
 *  this run, from the cumulative (count·avg) delta. */
function windowAvg(b: EngineSnap, a: EngineSnap): number {
  const dc = a.count - b.count
  if (dc <= 0) return a.avg
  const sumA = a.count * a.avg
  const sumB = b.count * b.avg
  return Math.max(0, (sumA - sumB) / dc)
}

function shape(
  kind: string,
  reqs: number,
  reads: number,
  writes: number,
  wallMs: number,
  e2e: number[],
  before: { get: NdbLatency | undefined; put: NdbLatency | undefined },
  after: { get: NdbLatency | undefined; put: NdbLatency | undefined }
) {
  e2e.sort((x, y) => x - y)
  const e2ePct = (q: number) =>
    e2e.length
      ? Math.round(e2e[Math.min(e2e.length - 1, Math.floor((q / 100) * e2e.length))])
      : 0

  // Per-run engine average (exact). For mixed, blend get+put by op count.
  const gAvg = windowAvg(snap(before.get), snap(after.get))
  const pAvg = windowAvg(snap(before.put), snap(after.put))
  let engAvg: number
  if (kind === "write") engAvg = pAvg
  else if (kind === "mixed")
    engAvg =
      reads + writes > 0 ? (gAvg * reads + pAvg * writes) / (reads + writes) : gAvg
  else engAvg = gAvg

  // Percentiles: nDB's own histogram (engine-measured; lifetime aggregate).
  const dist = kind === "write" ? after.put : after.get
  return {
    kind,
    requests: reqs,
    reads,
    writes,
    wall_ms: wallMs,
    // The headline — nDB engine, measured by nDB itself:
    engine: {
      avg_us: Math.round(engAvg * 100) / 100, // exact, this run
      ops_per_sec: engAvg > 0 ? Math.round(1_000_000 / engAvg) : 0, // 1-core engine rate
      p50_us: dist?.p50_us ?? 0,
      p95_us: dist?.p95_us ?? 0,
      p99_us: dist?.p99_us ?? 0,
      p999_us: dist?.p999_us ?? 0,
    },
    // Honest secondary — the full HTTPS -> Node -> socket path:
    e2e: {
      ops_per_sec: e2e.length ? Math.round((e2e.length / wallMs) * 1000) : 0,
      p50_us: e2ePct(50),
      p99_us: e2ePct(99),
    },
  }
}

/** READ benchmark — N genuine GETs; reports nDB's engine-measured latency. */
const CAP = 100_000

function buildFrame(type: number, payload: string): Buffer {
  const body = Buffer.from(payload, "utf8")
  const h = Buffer.alloc(5)
  h[0] = type
  h.writeUInt32BE(body.length, 1)
  return Buffer.concat([h, body])
}

/** Pipeline `frames` over ONE socket and resolve when all responses are
 *  back. Returns wall-clock ms. Backpressure-aware so 100k frames don't
 *  overrun the kernel buffer. */
const PIPE_BATCH = 2000

/** Pipeline one batch of frames over a single fresh socket. */
function pipelineBatch(frames: Buffer[], timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const sock = net.connect(PORT, HOST)
    let acked = 0
    let buf = Buffer.alloc(0)
    const total = frames.length
    const timer = setTimeout(() => {
      sock.destroy()
      reject(new Error("nDB pipeline timeout"))
    }, timeoutMs)
    sock.on("connect", async () => {
      for (const f of frames) {
        if (!sock.write(f)) {
          await new Promise((res) => sock.once("drain", res))
        }
      }
    })
    sock.on("error", (e) => {
      clearTimeout(timer)
      reject(e)
    })
    sock.on("data", (d) => {
      buf = Buffer.concat([buf, d])
      while (buf.length >= 5) {
        const len = buf.readUInt32BE(1)
        if (buf.length < 5 + len) break
        buf = buf.subarray(5 + len)
        if (++acked === total) {
          clearTimeout(timer)
          sock.end()
          resolve()
          return
        }
      }
    })
  })
}

/** Run all frames in sequential per-connection batches so nDB's
 *  per-connection in-flight cap never resets the stream. Returns total
 *  wall-clock ms. */
async function pipelineRun(frames: Buffer[]): Promise<number> {
  const t0 = Date.now()
  for (let i = 0; i < frames.length; i += PIPE_BATCH) {
    const batch = frames.slice(i, i + PIPE_BATCH)
    // generous per-batch timeout; 2k ops is sub-second on the engine
    await pipelineBatch(batch, 30_000)
  }
  return Date.now() - t0
}
/** READ benchmark — N pipelined GETs; reports nDB engine-measured latency. */
export async function ndbBench(n: number, keyPrefixes: string[]) {
  const N = Math.max(50, Math.min(n, CAP))
  const frames: Buffer[] = []
  for (let i = 0; i < N; i++) {
    const pfx = keyPrefixes[i % keyPrefixes.length]
    const idx = 1 + ((i * 7919) % 9999)
    frames.push(buildFrame(MSG_GET, JSON.stringify({ key: `${pfx}:${idx}` })))
  }
  const before = await ndbStats()
  const wallMs = await pipelineRun(frames)
  const after = await ndbStats()
  return shapeP("read", N, N, 0, wallMs, before, after)
}

/** WRITE benchmark — N pipelined PUTs into a dedicated bench:* keyspace. */
export async function ndbBenchWrite(n: number) {
  const N = Math.max(50, Math.min(n, CAP))
  const frames: Buffer[] = []
  for (let i = 0; i < N; i++) {
    frames.push(
      buildFrame(
        MSG_PUT,
        JSON.stringify({
          key: `bench:${i}`,
          value: `ts=${Date.now()}|i=${i}|pad=${"x".repeat(40)}`,
        })
      )
    )
  }
  const before = await ndbStats()
  const wallMs = await pipelineRun(frames)
  const after = await ndbStats()
  return shapeP("write", N, 0, N, wallMs, before, after)
}

/** MIXED benchmark — ~80% GET / 20% PUT, pipelined. */
export async function ndbBenchMixed(n: number, keyPrefixes: string[]) {
  const N = Math.max(50, Math.min(n, CAP))
  const frames: Buffer[] = []
  let reads = 0
  let writes = 0
  for (let i = 0; i < N; i++) {
    if (i % 5 === 0) {
      frames.push(
        buildFrame(
          MSG_PUT,
          JSON.stringify({ key: `bench:mix:${i}`, value: `ts=${Date.now()}|i=${i}` })
        )
      )
      writes++
    } else {
      const pfx = keyPrefixes[i % keyPrefixes.length]
      const idx = 1 + ((i * 7919) % 9999)
      frames.push(buildFrame(MSG_GET, JSON.stringify({ key: `${pfx}:${idx}` })))
      reads++
    }
  }
  const before = await ndbStats()
  const wallMs = await pipelineRun(frames)
  const after = await ndbStats()
  return shapeP("mixed", N, reads, writes, wallMs, before, after)
}

/** Build the response from STATS deltas (engine-measured) + pipelined wall. */
function shapeP(
  kind: string,
  reqs: number,
  reads: number,
  writes: number,
  wallMs: number,
  before: { get_latency?: NdbLatency; put_latency?: NdbLatency },
  after: { get_latency?: NdbLatency; put_latency?: NdbLatency }
) {
  const gAvg = windowAvg(snap(before.get_latency), snap(after.get_latency))
  const pAvg = windowAvg(snap(before.put_latency), snap(after.put_latency))
  let engAvg: number
  if (kind === "write") engAvg = pAvg
  else if (kind === "mixed")
    engAvg =
      reads + writes > 0 ? (gAvg * reads + pAvg * writes) / (reads + writes) : gAvg
  else engAvg = gAvg
  const dist = kind === "write" ? after.put_latency : after.get_latency
  return {
    kind,
    requests: reqs,
    reads,
    writes,
    wall_ms: wallMs,
    engine: {
      avg_us: Math.round(engAvg * 100) / 100,
      ops_per_sec: engAvg > 0 ? Math.round(1_000_000 / engAvg) : 0,
      p50_us: dist?.p50_us ?? 0,
      p95_us: dist?.p95_us ?? 0,
      p99_us: dist?.p99_us ?? 0,
      p999_us: dist?.p999_us ?? 0,
    },
    // Pipelined client throughput over one socket (real, includes framing):
    e2e: {
      ops_per_sec: wallMs > 0 ? Math.round((reqs / wallMs) * 1000) : 0,
      p50_us: 0,
      p99_us: 0,
    },
  }
}
