/**
 * Normalize a request path into a stable bucket so analytics can group
 * `/r/abc123` and `/r/xyz789` as the same logical page (`/r/[slug]`).
 *
 * Pure function, used both server- and client-side.
 */

const RULES: Array<{ test: RegExp; replace: string }> = [
  { test: /^\/r\/[A-Za-z0-9]{6,12}\/?$/, replace: "/r/[slug]" },
  { test: /^\/tools\/qr\/[A-Za-z0-9]{6,12}\/?$/, replace: "/tools/qr/[slug]" },
  // Catch-all "tools/<unknown>" pages (the soon/roadmap stub route).
  { test: /^\/tools\/[a-z0-9-]+\/?$/, replace: (path: string) => path } as never,
]

const KNOWN_TOOL_SLUGS = new Set(["downloader", "qr"])

export function normalizePath(rawPath: string): string {
  if (!rawPath) return "/"
  let path = rawPath.split("?")[0]!.split("#")[0]!
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1)
  if (path.length === 0) return "/"

  // /r/<slug> → /r/[slug]
  const rMatch = /^\/r\/[A-Za-z0-9]{6,12}$/.exec(path)
  if (rMatch) return "/r/[slug]"

  // /tools/qr/<slug> → /tools/qr/[slug]
  if (/^\/tools\/qr\/[A-Za-z0-9]{6,12}$/.test(path)) {
    return "/tools/qr/[slug]"
  }

  // /tools/<unknown> → /tools/[slug] (stub roadmap page)
  const t = /^\/tools\/([a-z0-9-]+)$/.exec(path)
  if (t && !KNOWN_TOOL_SLUGS.has(t[1]!)) {
    return "/tools/[slug]"
  }

  return path
}

/** True if a path should be excluded from analytics entirely. */
export function isTrackedPath(path: string): boolean {
  if (!path) return false
  if (path.startsWith("/_next")) return false
  if (path.startsWith("/api/")) return false
  if (path.startsWith("/admin")) return false
  if (path.startsWith("/stats")) return false
  if (
    /\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|css|js|map|woff2?|txt|xml)$/i.test(
      path
    )
  ) {
    return false
  }
  return true
}

// Suppress TS unused-warning for the placeholder rule.
void RULES
