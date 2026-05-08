import { PERSON, SITE } from "@/lib/site"

export const runtime = "nodejs"
export const dynamic = "force-static"

export async function GET() {
  const oneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z")

  const body = [
    `Contact: mailto:${PERSON.email}`,
    `Expires: ${oneYear}`,
    "Preferred-Languages: en",
    `Canonical: ${SITE.origin}/.well-known/security.txt`,
    `Policy: ${SITE.origin}/blog`,
    `Acknowledgments: ${SITE.origin}/blog`,
    "",
  ].join("\n")

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
