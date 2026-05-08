import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Check, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { FaqBlock } from "@/components/seo/FaqBlock"
import { JsonLd } from "@/components/seo/JsonLd"
import { PERSON, SITE, WEBSITE } from "@/lib/site"
import type { Faq } from "@/components/seo/ToolSeo"

const SLUG = "best-social-media-video-downloaders"
const URL = `${SITE.origin}/tools/${SLUG}`

const TITLE =
  "5 best free social media video downloaders for YouTube, Instagram, TikTok and X (2026)"
const SUMMARY =
  "Honest comparison of five free video downloaders that handle YouTube, Instagram Reels, TikTok, X, Reddit and other social platforms — what each does well, where they fail or upsell, and which one to pick. Updated April 2026."

const COMPETITORS = [
  {
    name: "Social Media Downloader (nandishwarsingh.com)",
    url: `${SITE.origin}/tools/downloader`,
    sites: "YouTube, Instagram, TikTok, X, Reddit, Vimeo, Facebook, Twitch, 1,800+ via yt-dlp",
    formats: "MP4 / WebM / MKV video; MP3 / M4A / Opus / WAV / FLAC audio",
    extras:
      "Subtitle embed/download, trim with timestamps, playlist zip, transcript with timestamps",
    pros: [
      "Most platforms supported (yt-dlp upstream)",
      "Audio extraction in 5 codecs including FLAC",
      "Trim before download — no second tool needed",
      "Transcribe button pulls captions with timestamps",
      "No file storage on server — files are streamed and discarded",
    ],
    cons: [
      "Long videos (>1 h) need patience",
      "Self-hosted on a single VPS, so brief unavailability is possible",
    ],
    bestFor:
      "Anyone who wants the widest format support and audio extraction without a desktop install.",
  },
  {
    name: "yt-dlp (CLI)",
    url: "https://github.com/yt-dlp/yt-dlp",
    sites: "1,800+ — the upstream library every web tool wraps",
    formats: "Anything ffmpeg can produce",
    extras:
      "Format selectors, post-processing, cookies, concurrent fragments, embed everything",
    pros: [
      "Most flexible option — every flag, every format",
      "Free, open source, actively maintained",
      "Bypasses most rate-limit / sign-in walls with cookies",
    ],
    cons: [
      "Command-line only — non-trivial for non-developers",
      "You manage your own ffmpeg + Python install",
    ],
    bestFor:
      "Developers who want full control and don't mind running a CLI per download.",
  },
  {
    name: "SaveFrom (savefrom.net)",
    url: "https://en.savefrom.net",
    sites: "YouTube, Instagram, TikTok, X, Facebook (no full coverage of long-tail)",
    formats: "MP4, MP3 (limited bitrate options on free)",
    extras: "Browser extension",
    pros: [
      "Famous, been around forever — easy first hit on Google",
      "No install for the web version",
    ],
    cons: [
      "Aggressive ads, redirect interstitials",
      "Doesn't handle private / age-restricted content",
      "Paid 'PRO' tier removes ads and adds quality options",
    ],
    bestFor:
      "Casual one-off downloads when you don't mind banner ads.",
  },
  {
    name: "SnapDownloader (snapdownloader.com)",
    url: "https://snapdownloader.com",
    sites: "YouTube, Instagram, TikTok, X, Vimeo, ~900 sites total",
    formats: "MP4 up to 8K, MP3, GIF",
    extras: "Schedule downloads, batch mode",
    pros: [
      "8K + 60fps support, batch mode",
      "Polished native app experience",
    ],
    cons: [
      "Paid — $19.99/year personal, no real free tier",
      "Desktop install required",
    ],
    bestFor:
      "Power users buying a desktop app for routine batch work.",
  },
  {
    name: "4K Video Downloader+ (4kdownload.com)",
    url: "https://www.4kdownload.com/products/videodownloader",
    sites: "YouTube, Vimeo, Twitch, TikTok, Instagram",
    formats: "MP4 / MKV up to 8K, MP3, M4A",
    extras: "Subtitles, playlist mode, smart mode (preset presets)",
    pros: [
      "Long-standing reputation, active updates",
      "Good UX for non-technical users",
    ],
    cons: [
      "Free tier has download caps (~30/day)",
      "Premium $45 lifetime per device",
      "Desktop install only",
    ],
    bestFor:
      "Non-technical users willing to pay once for a polished GUI.",
  },
] as const

const FAQS: Faq[] = [
  {
    q: "Which social media video downloader supports the most platforms?",
    a: "Anything built on yt-dlp — including the Social Media Downloader on nandishwarsingh.com — covers about 1,800 sites including YouTube, Instagram, TikTok, X, Reddit, Vimeo, Twitch, Facebook, Bilibili, Dailymotion, SoundCloud and many more. Standalone tools like SaveFrom or SnapDownloader cover only the major platforms (sub-100 sites).",
  },
  {
    q: "Is downloading videos from YouTube or Instagram legal?",
    a: "Personal-use downloads are generally allowed in most jurisdictions; what's commonly prohibited is re-uploading or commercially distributing copyrighted content. Some platforms' terms of service technically restrict downloads — enforcement is rare for personal use, but you should check the rules where you live.",
  },
  {
    q: "Can I download just the audio from a YouTube video as MP3?",
    a: "Yes. The Social Media Downloader, yt-dlp, 4K Video Downloader and SnapDownloader all support audio-only extraction. MP3 requires server-side re-encoding via ffmpeg; M4A is faster and lossless because it's the original audio stream from YouTube.",
  },
  {
    q: "Why do some downloads fail with a 403 or sign-in prompt?",
    a: "YouTube and Instagram both rotate signing keys and rate-limit aggressive scraping. Older yt-dlp builds get blocked when keys rotate — the fix is using the latest version (the Social Media Downloader auto-uses brew's nightly). Sign-in walls require cookies, which CLI yt-dlp supports but most web tools don't.",
  },
  {
    q: "Are there download size or daily limits?",
    a: "On the Social Media Downloader: no daily limits, no file size cap (long videos just take longer). 4K Video Downloader free caps at ~30 per day. SnapDownloader is paid-only. SaveFrom imposes ad interstitials on free.",
  },
  {
    q: "Can I trim a video before downloading?",
    a: "The Social Media Downloader supports start/end timestamps in its advanced options — fast, no second tool. yt-dlp does the same with --download-sections. Other web tools require you to download the full video and trim locally.",
  },
] as const

export const metadata: Metadata = {
  title: TITLE,
  description: SUMMARY,
  alternates: { canonical: `/tools/${SLUG}` },
  keywords: [
    "best video downloader",
    "youtube downloader",
    "instagram video downloader",
    "tiktok downloader",
    "twitter video downloader",
    "free video downloader",
    "yt-dlp alternative",
    "social media downloader comparison",
  ],
  openGraph: {
    title: TITLE,
    description: SUMMARY,
    url: `/tools/${SLUG}`,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SUMMARY,
  },
}

export default function BestDownloadersPage() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${URL}#list`,
    name: TITLE,
    description: SUMMARY,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: COMPETITORS.length,
    isPartOf: { "@id": WEBSITE.id },
    author: { "@id": PERSON.id },
    itemListElement: COMPETITORS.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: c.url,
      item: {
        "@type": "SoftwareApplication",
        name: c.name,
        url: c.url,
        applicationCategory: "MultimediaApplication",
        operatingSystem: c.url.includes("snapdownloader") || c.url.includes("4kdownload") ? "Windows, macOS, Linux" : "Web",
      },
    })),
  }
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${URL}#faq`,
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.origin },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE.origin}/tools` },
      { "@type": "ListItem", position: 3, name: TITLE, item: URL },
    ],
  }

  return (
    <article className="flex flex-col gap-8">
      <JsonLd data={itemList} />
      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbLd} />

      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground">
          Comparison · April 2026
        </span>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {TITLE}
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          {SUMMARY}
        </p>
      </header>

      <aside
        className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-relaxed text-foreground/90"
        aria-label="TL;DR"
      >
        <span className="mr-2 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
          TL;DR
        </span>
        For free, no-install, broadest support: the{" "}
        <Link href="/tools/downloader" className="underline">
          Social Media Downloader
        </Link>{" "}
        on this site (it wraps yt-dlp). For full power on the command line: yt-dlp
        directly. For paid native apps: SnapDownloader (batch / 8K) or 4K Video
        Downloader (polished). Skip SaveFrom unless you'll tolerate ads.
      </aside>

      <section className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-3 pr-4 font-medium">Tool</th>
              <th className="py-3 pr-4 font-medium">Sites covered</th>
              <th className="py-3 pr-4 font-medium">Formats</th>
              <th className="py-3 pr-4 font-medium">Extras</th>
            </tr>
          </thead>
          <tbody>
            {COMPETITORS.map((c) => (
              <tr key={c.name} className="border-b border-border/20 align-top">
                <td className="py-3 pr-4 font-medium">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    {c.name}
                    <ArrowUpRight className="size-3" />
                  </a>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{c.sites}</td>
                <td className="py-3 pr-4 text-muted-foreground">{c.formats}</td>
                <td className="py-3 pr-4 text-muted-foreground">{c.extras}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {COMPETITORS.map((c, i) => (
        <Card key={c.name} className="flex flex-col gap-3 p-5">
          <header className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {i + 1}. {c.name}
            </h2>
            <a
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Visit
              <ArrowUpRight className="size-3" />
            </a>
          </header>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Best for:</strong> {c.bestFor}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-300">
                Pros
              </h3>
              <ul className="flex flex-col gap-1 text-sm text-foreground/80">
                {c.pros.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-300">
                Cons
              </h3>
              <ul className="flex flex-col gap-1 text-sm text-foreground/80">
                {c.cons.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <X className="mt-0.5 size-3.5 shrink-0 text-amber-300" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ))}

      <FaqBlock faqs={[...FAQS]} />

      <Card className="flex flex-col items-start gap-3 border-emerald-500/20 bg-emerald-500/5 p-5 text-sm">
        <p className="text-foreground/90">
          Want the no-install option that supports the most sites?
        </p>
        <Link
          href="/tools/downloader"
          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20"
        >
          Open the Social Media Downloader
          <ArrowUpRight className="size-3.5" />
        </Link>
      </Card>
    </article>
  )
}
