import Image from "next/image"
import { Mail, MapPin, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { GithubIcon, LinkedinIcon } from "@/components/icons/brand-icons"
import { MotionFade } from "@/components/motion/MotionFade"

type Contact = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href?: string
}

const contacts: Contact[] = [
  {
    icon: Mail,
    label: "nandishwarjasrotia@gmail.com",
    href: "mailto:nandishwarjasrotia@gmail.com",
  },
  {
    icon: GithubIcon,
    label: "github.com/nandishwarsingh",
    href: "https://github.com/nandishwarsingh",
  },
  {
    icon: LinkedinIcon,
    label: "linkedin.com/in/nandishwarsingh",
  },
]

export function SideLeft() {
  return (
    <aside className="flex flex-col gap-4">
      <MotionFade>
        <Card className="group relative overflow-hidden p-0 transition-all duration-500 hover:shadow-2xl">
          {/* Animated gradient backdrop behind the photo */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,oklch(0.4_0.08_152/0.3),transparent_60%),radial-gradient(circle_at_70%_80%,oklch(0.4_0.08_30/0.25),transparent_60%)]"
          />
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src="/me.jpg"
              alt="Nandishwar Singh"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 320px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-card via-card/70 to-transparent" />
            <div className="absolute inset-x-5 bottom-5 flex flex-col gap-1.5">
              <Badge
                variant="outline"
                className="w-fit gap-1 border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 backdrop-blur-sm"
              >
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                </span>
                Available for work
              </Badge>
              <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-lg">
                Nandishwar Singh
              </h1>
            </div>
          </div>
          <div className="flex flex-col gap-2 p-5 pt-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Software engineer building useful things on the web.
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              <span>India</span>
              <span className="ml-auto inline-flex items-center gap-1 text-foreground/60">
                <Sparkles className="size-3" />
                <span>Currently shipping NVC</span>
              </span>
            </div>
          </div>
        </Card>
      </MotionFade>

      <MotionFade delay={0.08}>
        <Card className="p-5 transition-colors duration-300 hover:bg-card/70">
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Contact
          </h2>
          <Separator className="mb-3" />
          <ul className="flex flex-col gap-2.5">
            {contacts.map(({ icon: Icon, label, href }) => (
              <li key={label}>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2 text-sm text-foreground/80 transition-all hover:bg-foreground/5 hover:text-foreground"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                    <span className="truncate">{label}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 px-2 py-1.5 -mx-2 text-sm text-foreground/80">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{label}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </MotionFade>
    </aside>
  )
}
