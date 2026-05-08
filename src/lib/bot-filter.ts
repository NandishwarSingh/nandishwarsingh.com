import "server-only"

/**
 * Brutal bot detection: combines a wide UA blacklist, header sanity checks,
 * and signals reported by the client.
 *
 * Server-side checks alone won't catch every headless browser pretending to be
 * Chrome — that's why /api/track also accepts client-reported `signals` and the
 * call itself is a behavioural filter (a request that never runs JS never
 * reaches us).
 */

// Anything matching this regex is treated as a bot, no matter what.
const BOT_UA = new RegExp(
  [
    "bot",
    "crawl(?:er|ing)?",
    "spider",
    "scrap(?:e|er|ing|y)",
    "fetch",
    "http[-_ ]?client",
    "wget",
    "curl",
    "libwww",
    "python(?:-requests)?",
    "java(?:/|\\b)",
    "go-http",
    "axios",
    "node-fetch",
    "okhttp",
    "headless",
    "phantomjs",
    "puppeteer",
    "playwright",
    "selenium",
    "webdriver",
    "lighthouse",
    "pagespeed",
    "gtmetrix",
    "pingdom",
    "uptimerobot",
    "uptime\\.com",
    "newrelic",
    "datadog",
    "prometheus",
    "monitor",
    "preview",
    "facebookexternalhit",
    "facebookcatalog",
    "twitterbot",
    "telegrambot",
    "slackbot",
    "discordbot",
    "linkedinbot",
    "whatsapp",
    "embedly",
    "skypeuripreview",
    "applebot",
    "bingpreview",
    "duckduckbot",
    "yandex",
    "baiduspider",
    "petalbot",
    "ahrefsbot",
    "semrushbot",
    "mj12bot",
    "dotbot",
    "rogerbot",
    "seekport",
    "amazonbot",
    "bytespider",
    "censys",
    "shodan",
    "masscan",
    "zgrab",
    "nmap",
    "nikto",
    "wpscan",
  ].join("|"),
  "i"
)

/** UAs that are unmistakably synthetic (no browser identifiers at all). */
const HEADLESS_HINTS = /HeadlessChrome|electron|cypress|nightmare/i

export type BotCheck = {
  isBot: boolean
  reason?: string
}

export function checkUserAgent(ua: string | null | undefined): BotCheck {
  if (!ua) return { isBot: true, reason: "missing-ua" }
  if (ua.length < 16) return { isBot: true, reason: "ua-too-short" }
  if (HEADLESS_HINTS.test(ua)) return { isBot: true, reason: "headless-ua" }
  if (BOT_UA.test(ua)) return { isBot: true, reason: "ua-blacklist" }
  return { isBot: false }
}

export function checkHeaders(headers: Headers): BotCheck {
  const accept = headers.get("accept")
  const lang = headers.get("accept-language")
  if (!lang) return { isBot: true, reason: "no-accept-language" }
  if (!accept) return { isBot: true, reason: "no-accept" }
  // A real browser always sends accept-encoding too.
  if (!headers.get("accept-encoding")) {
    return { isBot: true, reason: "no-accept-encoding" }
  }
  return { isBot: false }
}

export type ClientSignals = {
  webdriver?: boolean
  hasPlugins?: boolean
  cookiesEnabled?: boolean
  languages?: number
  hardwareConcurrency?: number
  screenWidth?: number
  /** Free-form note the client may send about its own bot suspicion. */
  flagged?: string
}

export function checkClientSignals(signals: ClientSignals | undefined): BotCheck {
  if (!signals) return { isBot: false }
  if (signals.webdriver === true) {
    return { isBot: true, reason: "navigator.webdriver" }
  }
  if (signals.flagged) {
    return { isBot: true, reason: signals.flagged.slice(0, 60) }
  }
  if (signals.cookiesEnabled === false) {
    return { isBot: true, reason: "cookies-disabled" }
  }
  if (signals.screenWidth !== undefined && signals.screenWidth === 0) {
    return { isBot: true, reason: "zero-screen" }
  }
  if (
    signals.hardwareConcurrency !== undefined &&
    signals.hardwareConcurrency === 0
  ) {
    return { isBot: true, reason: "zero-cpu" }
  }
  return { isBot: false }
}

export function combinedBotCheck(args: {
  ua: string | null | undefined
  headers: Headers
  signals?: ClientSignals
}): BotCheck {
  const checks = [
    checkUserAgent(args.ua),
    checkHeaders(args.headers),
    checkClientSignals(args.signals),
  ]
  for (const c of checks) {
    if (c.isBot) return c
  }
  return { isBot: false }
}
