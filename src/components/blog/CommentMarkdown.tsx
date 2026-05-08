import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

/**
 * Comment-safe markdown renderer. Crucially does NOT include rehype-raw,
 * so any inline HTML the commenter pastes is escaped — no XSS surface.
 */
export function CommentMarkdown({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "prose prose-invert prose-sm max-w-none prose-p:my-2 prose-pre:my-2 prose-pre:rounded prose-pre:bg-background/60 prose-code:rounded prose-code:bg-muted/40 prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none prose-a:underline prose-a:underline-offset-2 hover:prose-a:opacity-80 prose-blockquote:border-l-2 prose-blockquote:border-border/50 prose-blockquote:pl-3 prose-blockquote:italic",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
