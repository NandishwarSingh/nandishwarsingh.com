export const AUTOBLOG = {
  cadenceHours: 6,
  defaultStatus: (process.env.AUTOBLOG_STATUS === "published"
    ? "published"
    : "draft") as "draft" | "published",

  models: {
    writer: process.env.OPENROUTER_WRITER_MODEL ?? "openrouter/free",
    verifier: process.env.OPENROUTER_VERIFIER_MODEL ?? "openrouter/free",
  },

  limits: {
    writerMaxOutputTokens: 8_000,
    lockTtlMinutes: 15,
    dedupWindowDays: 30,
  },

  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  siteUrl:
    process.env.AUTOBLOG_SITE_URL ??
    process.env.SITE_ORIGIN ??
    "https://nandishwarsingh.com",
  appName: "nandishwarsingh.com",
}

/** Evergreen builder-voice topics. Rotated through; deduped against recent posts. */
export const TOPIC_POOL: string[] = [
  "Designing a single-flight lock for a Next.js cron handler in MongoDB",
  "Why I prefer MongoDB for portfolio-scale side projects",
  "Bot filtering for first-party analytics without a third-party SDK",
  "Building a public stats dashboard that crawlers can actually index",
  "How I structured authentication for a one-person admin panel",
  "Schema.org JSON-LD: what actually moves the needle for search and LLMs",
  "Writing an llms.txt and llms-full.txt that AI engines reliably ingest",
  "What changed when I moved a static site behind a Next.js reverse proxy",
  "Tracking real-time visitors with sub-second latency on a single VPS",
  "Open Graph images at the edge: lessons from generating them per request",
  "Using IndexNow to push fresh content to Bing and Yandex from Next.js",
  "Custom QR code design without a paid SaaS — the math behind the dots",
  "Why I stopped using ORMs for read-heavy MongoDB workloads",
  "Bundling a comparison page that out-ranks the affiliate spam farms",
  "Writing copy that ChatGPT, Claude, and Perplexity all feel safe citing",
  "Server-Sent Events vs polling for a live-traffic dashboard",
  "How a 5-line nginx tweak doubled my Lighthouse score",
  "What I learned the third time I shipped my own blog engine",
  "Designing a CommentSection that survives without an account system",
  "Pushing free-tier LLMs into useful long-form output via better prompting",
  "Sitemap, robots.txt, and the underrated power of a clean canonical URL",
  "Per-page OpenGraph images in Next.js without buying a SaaS",
]

export function autoblogConfigured(): boolean {
  return AUTOBLOG.apiKey.length > 0
}
