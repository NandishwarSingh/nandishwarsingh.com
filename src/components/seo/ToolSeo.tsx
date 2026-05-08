import { JsonLd } from "./JsonLd"
import { PERSON, SITE, WEBSITE } from "@/lib/site"

export type Faq = { q: string; a: string }

type Props = {
  /** Pure tool slug (e.g. "downloader", "qr"). */
  slug: string
  name: string
  /** Plain-text answer-first description that mirrors the on-page H1 + intro. */
  description: string
  /** Same FAQs that the page renders visibly. LLMs cite from the visible HTML; schema mirrors it for search engines. */
  faqs: Faq[]
  /** A handful of feature bullets (short noun phrases). */
  features?: string[]
  /** Fully-qualified screenshot URL for the SoftwareApplication. */
  screenshot?: string
  /** Schema.org applicationCategory — usually "MultimediaApplication" or "BusinessApplication". */
  applicationCategory?: string
}

/** Emits SoftwareApplication + FAQPage joined to the site entity graph. */
export function ToolSeo({
  slug,
  name,
  description,
  faqs,
  features,
  screenshot,
  applicationCategory = "MultimediaApplication",
}: Props) {
  const url = `${SITE.origin}/tools/${slug}`
  const id = `${url}#software`

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": id,
    name,
    description,
    url,
    applicationCategory,
    operatingSystem: "Web",
    browserRequirements: "Modern browser with JavaScript",
    isAccessibleForFree: true,
    inLanguage: "en",
    creator: { "@id": PERSON.id },
    publisher: { "@id": PERSON.id },
    isPartOf: { "@id": WEBSITE.id },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    ...(features?.length ? { featureList: features } : {}),
    ...(screenshot ? { screenshot } : {}),
  }

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntityOfPage: { "@id": id },
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }

  return (
    <>
      <JsonLd data={software} />
      <JsonLd data={faq} />
    </>
  )
}
