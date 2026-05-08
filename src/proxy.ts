import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ADMIN_USER = process.env.ADMIN_USER ?? "nandishwar"
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? "Panchratana1!"
const REALM = "Nandishwar admin"

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}

/** Constant-time string compare without `node:crypto` (proxy runs on Edge). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) {
    r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return r === 0
}

export function proxy(request: NextRequest) {
  const auth = request.headers.get("authorization") ?? ""
  if (!auth.toLowerCase().startsWith("basic ")) return unauthorized()
  let decoded: string
  try {
    decoded = atob(auth.slice(6).trim())
  } catch {
    return unauthorized()
  }
  const sep = decoded.indexOf(":")
  if (sep < 0) return unauthorized()
  const user = decoded.slice(0, sep)
  const pass = decoded.slice(sep + 1)
  if (!safeEqual(user, ADMIN_USER) || !safeEqual(pass, ADMIN_PASS)) {
    return unauthorized()
  }
  // Authenticated — pass through.
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
}
