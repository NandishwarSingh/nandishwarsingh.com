import { runAutoblog } from "@/lib/autoblog/pipeline"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function POST() {
  const result = await runAutoblog()
  return Response.json(result, { status: result.ok ? 200 : 200 })
}

export async function GET() {
  return Response.json({
    ok: true,
    endpoint: "autoblog/run",
    note: "POST to trigger a run.",
  })
}
