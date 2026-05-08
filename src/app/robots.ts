import type { MetadataRoute } from "next"
import { SITE } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: every crawler welcome on public surfaces.
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/admin", "/api/admin/"],
      },
      // Explicit allow for the AI crawlers we want to be cited by.
      // Listing them by name beats relying on the wildcard so the intent is
      // legible to humans reading the file.
      ...[
        "GPTBot",
        "ChatGPT-User",
        "OAI-SearchBot",
        "Google-Extended",
        "PerplexityBot",
        "ClaudeBot",
        "anthropic-ai",
        "Applebot-Extended",
        "Meta-ExternalAgent",
        "Bingbot",
        "Googlebot",
      ].map((agent) => ({
        userAgent: agent,
        allow: ["/", "/tools", "/blog", "/stats", "/r/"],
        disallow: ["/admin", "/admin/", "/api/admin", "/api/admin/"],
      })),
      // Pure-scrape crawlers — no LLM citation upside, training-data resellers.
      {
        userAgent: "CCBot",
        disallow: "/",
      },
      {
        userAgent: "Bytespider",
        disallow: "/",
      },
    ],
    sitemap: `${SITE.origin}/sitemap.xml`,
    host: SITE.origin,
  }
}
