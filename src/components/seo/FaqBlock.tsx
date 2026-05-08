import type { Faq } from "./ToolSeo"

/**
 * Visible FAQ. Crawlers + LLMs read from this HTML. The matching FAQPage
 * JSON-LD lives in <ToolSeo />; both must be present together.
 */
export function FaqBlock({
  faqs,
  heading = "Frequently asked questions",
  className,
}: {
  faqs: Faq[]
  heading?: string
  className?: string
}) {
  return (
    <section
      className={
        "flex flex-col gap-3 rounded-lg border border-border/40 bg-background/30 p-5 " +
        (className ?? "")
      }
      aria-label={heading}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {heading}
      </h2>
      <ol className="flex flex-col gap-3">
        {faqs.map((f, i) => (
          <li key={i} className="flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold text-foreground">{f.q}</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{f.a}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
