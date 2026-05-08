import { cn } from "@/lib/utils"
import { gravatarUrl, initials } from "@/lib/comments"

export function Avatar({
  name,
  emailHash,
  size = 32,
  className,
}: {
  name: string
  emailHash?: string | null
  size?: number
  className?: string
}) {
  if (emailHash) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={gravatarUrl(emailHash, size * 2)}
        width={size}
        height={size}
        alt={`${name}'s avatar`}
        className={cn("rounded-full bg-background/60", className)}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border/40 bg-background/60 text-[11px] font-semibold uppercase text-muted-foreground",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={`${name}'s avatar`}
    >
      {initials(name)}
    </div>
  )
}
