import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Tracker } from "@/components/analytics/Tracker";
import { RootJsonLd } from "@/components/seo/JsonLd";
import { DEFAULT_OG_IMAGE, PERSON, SITE, VERIFICATION } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: SITE.themeColorLight },
    { media: "(prefers-color-scheme: dark)", color: SITE.themeColor },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
};

const verification: Metadata["verification"] = {}
if (VERIFICATION.google) verification.google = VERIFICATION.google
if (VERIFICATION.yandex) verification.yandex = VERIFICATION.yandex
if (VERIFICATION.bing || VERIFICATION.pinterest || VERIFICATION.facebook) {
  verification.other = {
    ...(VERIFICATION.bing && { "msvalidate.01": VERIFICATION.bing }),
    ...(VERIFICATION.pinterest && { "p:domain_verify": VERIFICATION.pinterest }),
    ...(VERIFICATION.facebook && {
      "facebook-domain-verification": VERIFICATION.facebook,
    }),
  }
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE.origin),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: PERSON.name, url: PERSON.url }],
  creator: PERSON.name,
  publisher: PERSON.name,
  category: "technology",
  keywords: [...SITE.primaryKeywords],
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.origin,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    creator: SITE.twitterHandle,
    site: SITE.twitterHandle,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  alternates: {
    canonical: "/",
    types: {
      "application/atom+xml": [
        { url: "/blog/feed.xml", title: `${SITE.name} — Blog` },
      ],
      "application/rss+xml": [
        { url: "/blog/feed.xml", title: `${SITE.name} — Blog` },
      ],
    },
  },
  appleWebApp: {
    capable: true,
    title: SITE.shortName,
    statusBarStyle: "black-translucent",
  },
  ...(Object.keys(verification).length > 0 ? { verification } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={SITE.language}
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        {PERSON.sameAs.map((url) => (
          <link key={url} rel="me" href={url} />
        ))}
        <link rel="author" href={`${SITE.origin}/#person`} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <RootJsonLd />
        {children}
        <Tracker />
      </body>
    </html>
  );
}
