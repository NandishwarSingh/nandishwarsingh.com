import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShimmeringText } from "@/components/ui/shimmering-text"
import { MotionFade } from "@/components/motion/MotionFade"
import { JsonLd } from "@/components/seo/JsonLd"
import { GithubIcon } from "@/components/icons/brand-icons"
import { SITE, PERSON, WEBSITE } from "@/lib/site"
import { NdbShowcase } from "./NdbShowcase"

const REPO = "https://github.com/NandishwarSingh/nDB"

export const metadata: Metadata = {
  title: "nDB — live LSM-tree storage engine in C (run the benchmarks yourself)",
  description:
    "A real nDB instance running on this server with 50,000 rows. Fire live read / write / mixed benchmarks against the C engine and watch measured microsecond latency and throughput in real time. No mockups.",
  keywords: [
    "nDB",
    "LSM tree database C",
    "live database benchmark",
    "storage engine",
    "Nandishwar Singh",
  ],
  alternates: { canonical: "/nDB" },
  openGraph: {
    title: "nDB — live, benchmarkable LSM-tree engine in C",
    description:
      "A real nDB instance with 50,000 rows. Run read/write/mixed benchmarks live and watch measured µs latency + throughput.",
    url: "/nDB",
    type: "website",
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "nDB — live, benchmarkable LSM-tree engine in C",
    description:
      "Real running instance, 50,000 rows. Fire live benchmarks and watch real µs latency.",
  },
}

export default function NdbPage() {
  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "@id": `${SITE.origin}/nDB#software`,
    name: "nDB",
    description:
      "A high-performance LSM-tree storage engine in C with zero dependencies — WAL, bloom filters, SYNC_NONE durability, SQL and blob storage. Demonstrated with a live, benchmarkable instance.",
    url: `${SITE.origin}/nDB`,
    codeRepository: REPO,
    programmingLanguage: "C",
    author: { "@id": PERSON.id },
    isPartOf: { "@id": WEBSITE.id },
    license: "https://opensource.org/license/mit",
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.origin },
      { "@type": "ListItem", position: 2, name: "nDB", item: `${SITE.origin}/nDB` },
    ],
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <JsonLd data={softwareLd} />
      <JsonLd data={breadcrumbLd} />

      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mb-8 -ml-2 text-muted-foreground"
      >
        <Link href="/">
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
      </Button>

      <MotionFade>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_oklch(0.7_0.18_152)]"
          />
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Experiment · live instance
          </span>
        </div>
        <h1 className="mt-3 flex items-center gap-3 text-4xl font-bold tracking-tight sm:text-5xl">
          <Database className="size-9 text-emerald-400" />
          <ShimmeringText text="nDB" className="text-4xl font-bold sm:text-5xl" />
        </h1>
        <p className="mt-4 text-base leading-relaxed text-foreground/80">
          An LSM-tree storage engine written from scratch in{" "}
          <span className="text-foreground">C</span>, zero dependencies. There
          is a <span className="text-foreground">real nDB process running on
          this server right now</span> with{" "}
          <span className="text-foreground">50,000 rows</span> loaded. Don&apos;t
          take the numbers on faith — fire the benchmarks below and watch the
          measured latency yourself.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "C · zero deps",
            "LSM-tree",
            "SYNC_NONE (fastest)",
            "WAL recovery",
            "bloom filters",
            "50,000 live rows",
          ].map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>
        <div className="mt-5">
          <Button asChild size="sm">
            <a href={REPO} target="_blank" rel="noopener noreferrer">
              <GithubIcon className="size-4" />
              Source on GitHub
            </a>
          </Button>
        </div>
      </MotionFade>

      <div className="mt-10">
        <NdbShowcase />
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Backed by a live nDB instance (durability mode{" "}
        <code className="rounded bg-muted px-1">SYNC_NONE</code> — no fsync
        overhead, highest throughput). Bridge is read-biased and rate-capped;
        the engine is CPU/RAM-sandboxed.{" "}
        <a
          href={REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Read the C source →
        </a>
      </p>
    </main>
  )
}
