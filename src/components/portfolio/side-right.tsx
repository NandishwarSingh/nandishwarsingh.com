import { ArrowUpRight, Briefcase, FolderGit2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MotionFade } from "@/components/motion/MotionFade"

const experience = [
  {
    role: "AI Full-Stack Engineer Intern",
    company: "GetDusky.ai (formerly HireCreatives)",
    period: "2025 — Present",
    points: [
      "Build production features for Dusky AI, an AI canvas that helps creators research top channels, import context, find viral outliers, and rescript content into winning formats.",
      "Contribute across frontend, backend, AI workflow, and production debugging in a fast-moving startup environment.",
      "Build creator-focused AI workflows: structured context, templates, model-assisted generation, collaborative canvas-style flows.",
      "Helped move the product from early build stage into production usage while owning requirements, debugging, deployment readiness, and code quality.",
    ],
  },
]

const projects = [
  {
    name: "NVC — Neural Video Codec",
    description:
      "Custom .nvc codec/container with Zig CLI, browser playback, WebGPU neural reconstruction, model artifacts, feature residuals, color tuning, grain synthesis, CRC-checked chunks, and reproducible benchmarks.",
    tags: ["Zig", "TypeScript", "WebGPU", "WebCodecs", "FFmpeg", "PyTorch"],
    href: "/nvc/",
  },
  {
    name: "GeoPolitiq — AI Geopolitics Platform",
    description:
      "Automated news generation with Perplexity Sonar / OpenRouter search, scheduled jobs, verification flow, smart image search, and AI-assisted publishing. Admin dashboard, push notifications, analytics, sitemap.",
    tags: ["Node.js", "Express", "MongoDB", "OpenRouter", "Web Push"],
    href: "https://github.com/NandishwarSingh/GeoPolitiq",
  },
  {
    name: "nDB — High-Performance Storage Engine",
    description:
      "LSM-tree storage engine in C with memtables, SSTables, WAL, Bloom filters, background compaction, crash recovery, TCP server, binary protocol, and a SQL-style interface.",
    tags: ["C", "Systems", "Storage Engines"],
    href: "https://github.com/NandishwarSingh/nDB",
  },
]

export function SideRight() {
  return (
    <aside className="flex flex-col gap-4">
      <MotionFade delay={0.1}>
        <Card className="p-5 transition-colors duration-300 hover:bg-card/70">
          <header className="mb-3 flex items-center gap-2">
            <Briefcase className="size-4 text-muted-foreground" />
            <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Experience
            </h2>
          </header>
          <Separator className="mb-4" />
          <ol className="flex flex-col gap-5">
            {experience.map((item) => (
              <li key={item.role + item.company} className="relative flex flex-col gap-1.5 pl-4 before:absolute before:left-0 before:top-2 before:size-1.5 before:rounded-full before:bg-emerald-400 before:shadow-[0_0_12px_oklch(0.7_0.18_152)]">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold tracking-tight">{item.role}</h3>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{item.period}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.company}</p>
                <ul className="mt-1 flex list-disc flex-col gap-1 pl-4 text-xs leading-relaxed text-foreground/75 marker:text-muted-foreground">
                  {item.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Card>
      </MotionFade>

      <MotionFade delay={0.16}>
        <Card className="p-5 transition-colors duration-300 hover:bg-card/70">
          <header className="mb-3 flex items-center gap-2">
            <FolderGit2 className="size-4 text-muted-foreground" />
            <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Projects
            </h2>
          </header>
          <Separator className="mb-4" />
          <ul className="flex flex-col gap-1">
            {projects.map((project) => {
              const isExternal = project.href.startsWith("http")
              return (
                <li key={project.name}>
                  <a
                    href={project.href}
                    target={isExternal ? "_blank" : undefined}
                    rel="noreferrer"
                    className="group relative flex flex-col gap-1.5 rounded-lg px-3 py-3 -mx-3 transition-all duration-300 hover:bg-foreground/5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold tracking-tight transition-colors group-hover:text-foreground">
                        {project.name}
                      </h3>
                      <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{project.description}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {project.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px] font-normal transition-colors group-hover:bg-foreground/15">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </a>
                </li>
              )
            })}
          </ul>
        </Card>
      </MotionFade>
    </aside>
  )
}
