export const SITE = {
  origin: process.env.SITE_ORIGIN ?? "https://nandishwarsingh.com",
  name: "Nandishwar Singh",
  shortName: "nandishwar.singh",
  tagline: "Software engineer building real, useful tools on the web",
  description:
    "Nandishwar Singh is a software engineer shipping useful tools on the web. Long-form engineering blog, QR code studio with click analytics, and a public live-traffic dashboard.",
  locale: "en_US",
  language: "en",
  twitterHandle: "@nandishwarsingh",
  themeColor: "#0a0a0a",
  themeColorLight: "#fafafa",
  /** Used for keywords arrays + sitewide topical signals. */
  primaryKeywords: [
    "Nandishwar Singh",
    "software engineer portfolio",
    "engineering blog",
    "QR code generator with analytics",
    "live website traffic dashboard",
    "developer blog",
    "Next.js portfolio",
  ],
  founded: "2025-04",
} as const

export const PERSON = {
  id: `${SITE.origin}/#person`,
  name: SITE.name,
  givenName: "Nandishwar",
  familyName: "Singh",
  jobTitle: "Software Engineer",
  description:
    "Software engineer who ships small, focused web tools. Builder of nandishwarsingh.com — a long-form engineering blog, QR code studio, and public live-traffic dashboard.",
  url: SITE.origin,
  image: `${SITE.origin}/me.jpg`,
  email: "goyalrohan2020@gmail.com",
  knowsAbout: [
    "Software engineering",
    "Web development",
    "Next.js",
    "TypeScript",
    "React",
    "Node.js",
    "MongoDB",
    "Search engine optimization",
    "Site reliability",
    "Real-time analytics",
    "QR codes",
    "Technical writing",
  ],
  knowsLanguage: ["en", "hi"],
  /**
   * `sameAs` is the entity-graph glue. Every URL here should publish the same
   * name + avatar + bio so Google and AI engines merge them into one entity.
   */
  sameAs: [
    "https://github.com/NandishwarSingh",
    "https://x.com/nandishwarsingh",
    "https://linkedin.com/in/nandishwarsingh",
  ],
} as const

export const WEBSITE = {
  id: `${SITE.origin}/#website`,
  url: SITE.origin,
  name: SITE.name,
  description: SITE.description,
  inLanguage: SITE.language,
  publisherId: PERSON.id,
} as const

export const DEFAULT_OG_IMAGE = `${SITE.origin}/me.jpg`

/** Search-engine verification tokens — set via env, rendered as meta tags. */
export const VERIFICATION = {
  google: process.env.GOOGLE_SITE_VERIFICATION ?? "",
  bing: process.env.BING_SITE_VERIFICATION ?? "",
  yandex: process.env.YANDEX_SITE_VERIFICATION ?? "",
  pinterest: process.env.PINTEREST_SITE_VERIFICATION ?? "",
  facebook: process.env.FACEBOOK_DOMAIN_VERIFICATION ?? "",
} as const
