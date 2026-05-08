import type { NextRequest } from "next/server"
import { pingIndexNow } from "@/lib/indexnow"
import { SITE } from "@/lib/site"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_URLS = [
  `${SITE.origin}/`,
  `${SITE.origin}/blog`,
  `${SITE.origin}/tools`,
  `${SITE.origin}/stats`,
  `${SITE.origin}/sitemap.xml`,
]

function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="indexnow", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}

function adminGate(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? ""
  if (!auth.toLowerCase().startsWith("basic ")) return false
  try {
    const decoded = atob(auth.slice(6).trim())
    const sep = decoded.indexOf(":")
    if (sep < 0) return false
    const user = decoded.slice(0, sep)
    const pass = decoded.slice(sep + 1)
    return (
      user === (process.env.ADMIN_USER ?? "") &&
      pass === (process.env.ADMIN_PASSWORD ?? "")
    )
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!adminGate(req)) return unauthorized()
  const url = new URL(req.url)
  const target = url.searchParams.get("url")
  const urls = target ? [target] : DEFAULT_URLS
  const result = await pingIndexNow(urls)
  return Response.json(
    { ...result, pinged: urls },
    { status: result.ok ? 200 : 502 }
  )
}

export async function POST(req: NextRequest) {
  if (!adminGate(req)) return unauthorized()
  let body: { urls?: string[] }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const urls = (body.urls ?? []).filter((u): u is string => typeof u === "string")
  if (urls.length === 0) {
    return Response.json({ error: "Provide { urls: string[] }" }, { status: 400 })
  }
  const result = await pingIndexNow(urls)
  return Response.json(
    { ...result, pinged: urls },
    { status: result.ok ? 200 : 502 }
  )
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { Allow: "GET, POST, OPTIONS", "X-IndexNow-Site": SITE.origin },
  })
}
