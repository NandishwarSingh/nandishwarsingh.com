import type { Metadata } from "next"
import { AdminDashboard } from "@/components/analytics/AdminDashboard"
import { JsonLd } from "@/components/seo/JsonLd"
import { ensureIndexes, pageViews, sessions } from "@/lib/db"
import { PERSON, SITE, WEBSITE } from "@/lib/site"

export const metadata: Metadata = {
  title:
    "Live traffic & per-tool usage stats — public dashboard for nandishwarsingh.com",
  description:
    "Real-time public analytics for nandishwarsingh.com — total visitors, country breakdown, per-tool usage, time on site, bounce rate. Updated continuously, brutal bot filtering applied.",
  alternates: { canonical: "/stats" },
  openGraph: {
    title: "Live traffic stats — nandishwarsingh.com",
    description:
      "Public, real-time analytics: visits, sessions, country mix, per-tool usage, time on site, bounce rate.",
    url: "/stats",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live traffic stats — nandishwarsingh.com",
    description:
      "Public, real-time analytics for the whole site. No password.",
  },
}

// 60-second ISR: balance freshness with crawler-cacheability.
export const revalidate = 60

export default async function StatsPage() {
  await ensureIndexes()
  const pv = await pageViews()
  const ss = await sessions()

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [views30d, sessions30d, countries, paths, sessionAgg] = await Promise.all([
    pv.countDocuments({ ts: { $gte: since30d }, isBot: false }),
    ss.countDocuments({ startedAt: { $gte: since30d }, isBot: false }),
    pv
      .aggregate<{ country: string; views: number }>([
        { $match: { ts: { $gte: since30d }, isBot: false } },
        {
          $group: {
            _id: { $ifNull: ["$country", "—"] },
            views: { $sum: 1 },
          },
        },
        { $sort: { views: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, country: "$_id", views: 1 } },
      ])
      .toArray(),
    pv
      .aggregate<{ path: string; views: number }>([
        { $match: { ts: { $gte: since30d }, isBot: false } },
        { $group: { _id: "$path", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, path: "$_id", views: 1 } },
      ])
      .toArray(),
    ss
      .aggregate<{
        avgDurationMs: number
        bouncedSessions: number
        totalSessions: number
      }>([
        { $match: { startedAt: { $gte: since30d }, isBot: false } },
        {
          $group: {
            _id: null,
            avgDurationMs: { $avg: "$totalDurationMs" },
            bouncedSessions: {
              $sum: { $cond: [{ $lte: ["$pageCount", 1] }, 1, 0] },
            },
            totalSessions: { $sum: 1 },
          },
        },
      ])
      .next(),
  ])

  const avgDurationMs = sessionAgg?.avgDurationMs ?? 0
  const bounceRate = sessionAgg && sessionAgg.totalSessions > 0
    ? sessionAgg.bouncedSessions / sessionAgg.totalSessions
    : 0
  const updatedAt = new Date()

  const datasetLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE.origin}/stats#dataset`,
    name: "nandishwarsingh.com — public traffic dataset",
    description:
      "Real-time public web-traffic dataset for nandishwarsingh.com. Includes total page views, unique sessions, top pages, country breakdown, average session duration, and bounce rate. Bots are filtered out using a multi-layer behavioural and UA-based filter.",
    url: `${SITE.origin}/stats`,
    creator: { "@id": PERSON.id },
    publisher: { "@id": PERSON.id },
    isPartOf: { "@id": WEBSITE.id },
    license: "https://creativecommons.org/publicdomain/zero/1.0/",
    keywords: [
      "web traffic",
      "site analytics",
      "public dashboard",
      "page views",
      "bounce rate",
      "country breakdown",
      "per-tool usage",
    ],
    inLanguage: "en",
    isAccessibleForFree: true,
    dateModified: updatedAt.toISOString(),
    temporalCoverage: `${since30d.toISOString()}/${updatedAt.toISOString()}`,
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${SITE.origin}/api/stats?range=30d`,
      },
    ],
    variableMeasured: [
      { "@type": "PropertyValue", name: "Page views (30 days)", value: views30d },
      { "@type": "PropertyValue", name: "Sessions (30 days)", value: sessions30d },
      {
        "@type": "PropertyValue",
        name: "Average session duration (ms)",
        value: Math.round(avgDurationMs),
      },
      {
        "@type": "PropertyValue",
        name: "Bounce rate",
        value: Number((bounceRate * 100).toFixed(2)),
        unitText: "%",
      },
    ],
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.origin },
      { "@type": "ListItem", position: 2, name: "Live stats", item: `${SITE.origin}/stats` },
    ],
  }

  return (
    <>
      <JsonLd data={datasetLd} />
      <JsonLd data={breadcrumbLd} />

      {/*
        SSR snapshot: crawlers + LLMs see real, dated numbers in the HTML.
        The interactive dashboard hydrates over the top.
      */}
      <section
        className="mx-auto w-full max-w-[1400px] px-4 pt-6 lg:px-6 lg:pt-8"
        aria-label="Live traffic snapshot"
      >
        <div className="rounded-lg border border-border/40 bg-background/40 p-5">
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight">
              Public live traffic for nandishwarsingh.com
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Snapshot updated {updatedAt.toUTCString()} · 30-day window
            </p>
          </header>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/80">
            In the last 30 days, nandishwarsingh.com received{" "}
            <strong className="font-mono tabular-nums">
              {views30d.toLocaleString()}
            </strong>{" "}
            human page views from{" "}
            <strong className="font-mono tabular-nums">
              {sessions30d.toLocaleString()}
            </strong>{" "}
            sessions, with an average session length of{" "}
            <strong className="font-mono tabular-nums">
              {formatDuration(avgDurationMs)}
            </strong>{" "}
            and a bounce rate of{" "}
            <strong className="font-mono tabular-nums">
              {(bounceRate * 100).toFixed(1)}%
            </strong>
            . Bots are filtered with a 5-layer behavioural detector — see{" "}
            <a
              href="/blog/brutal-bot-filtering-for-first-party-analytics"
              className="underline hover:opacity-80"
            >
              the write-up
            </a>
            .
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Top countries (last 30 days)
              </h2>
              <ol className="flex flex-col gap-1 text-sm">
                {countries.length === 0 ? (
                  <li className="text-muted-foreground">No data yet.</li>
                ) : (
                  countries.map((c) => (
                    <li
                      key={c.country}
                      className="flex items-center justify-between"
                    >
                      <span>{c.country}</span>
                      <span className="font-mono tabular-nums text-muted-foreground">
                        {c.views.toLocaleString()}
                      </span>
                    </li>
                  ))
                )}
              </ol>
            </div>
            <div>
              <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Top pages (last 30 days)
              </h2>
              <ol className="flex flex-col gap-1 text-sm">
                {paths.length === 0 ? (
                  <li className="text-muted-foreground">No data yet.</li>
                ) : (
                  paths.map((p) => (
                    <li
                      key={p.path}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="truncate font-mono text-xs">{p.path}</span>
                      <span className="font-mono tabular-nums text-muted-foreground">
                        {p.views.toLocaleString()}
                      </span>
                    </li>
                  ))
                )}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <AdminDashboard />
    </>
  )
}

function formatDuration(ms: number): string {
  if (!ms || ms < 1000) return `${Math.max(0, Math.round(ms))} ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)} s`
  const m = s / 60
  if (m < 60) return `${m.toFixed(1)} min`
  return `${(m / 60).toFixed(1)} h`
}
