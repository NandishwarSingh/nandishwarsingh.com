import { listRuns } from "@/lib/autoblog/pipeline"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const runs = await listRuns()
  return Response.json({ runs })
}
