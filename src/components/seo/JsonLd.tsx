import { PERSON, WEBSITE, SITE } from "@/lib/site"

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function RootJsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": PERSON.id,
        name: PERSON.name,
        givenName: PERSON.givenName,
        familyName: PERSON.familyName,
        jobTitle: PERSON.jobTitle,
        description: PERSON.description,
        url: PERSON.url,
        image: {
          "@type": "ImageObject",
          url: PERSON.image,
          contentUrl: PERSON.image,
          caption: `${PERSON.name} — ${PERSON.jobTitle}`,
        },
        email: `mailto:${PERSON.email}`,
        knowsAbout: PERSON.knowsAbout,
        knowsLanguage: PERSON.knowsLanguage,
        sameAs: PERSON.sameAs,
        mainEntityOfPage: { "@id": WEBSITE.id },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE.id,
        url: WEBSITE.url,
        name: WEBSITE.name,
        alternateName: SITE.shortName,
        description: WEBSITE.description,
        inLanguage: WEBSITE.inLanguage,
        publisher: { "@id": PERSON.id },
        author: { "@id": PERSON.id },
        copyrightHolder: { "@id": PERSON.id },
        copyrightYear: 2025,
        keywords: SITE.primaryKeywords.join(", "),
        potentialAction: [
          {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${SITE.origin}/blog?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
          {
            "@type": "ReadAction",
            target: [`${SITE.origin}/blog`, `${SITE.origin}/tools`],
          },
        ],
      },
    ],
  }
  return <JsonLd data={graph} />
}
