import { PERSON, SITE } from "@/lib/site"

export const runtime = "nodejs"
export const dynamic = "force-static"

export async function GET() {
  const lines = [
    "/* TEAM */",
    `  Builder: ${PERSON.name}`,
    `  Role: ${PERSON.jobTitle}`,
    `  Site: ${SITE.origin}`,
    `  GitHub: ${PERSON.sameAs.find((u) => u.includes("github.com")) ?? ""}`,
    `  X: ${PERSON.sameAs.find((u) => u.includes("x.com")) ?? ""}`,
    `  LinkedIn: ${PERSON.sameAs.find((u) => u.includes("linkedin.com")) ?? ""}`,
    "",
    "/* THANKS */",
    "  Next.js, React, MongoDB, yt-dlp, ffmpeg, Tailwind, Lucide, Radix UI",
    "",
    "/* SITE */",
    "  Last update: " + new Date().toISOString().slice(0, 10),
    "  Language: English",
    "  Doctype: HTML5",
    "  Components: Next.js (App Router), TypeScript, Tailwind CSS",
    "",
  ]
  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
