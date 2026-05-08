import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSlug from "rehype-slug"
import { cn } from "@/lib/utils"

type Props = {
  content: string
  className?: string
}

/** Server-rendered markdown with raw HTML enabled (admin-authored, trusted). */
export function PostMarkdown({ content, className }: Props) {
  return (
    <article
      className={cn(
        "prose prose-invert prose-sm max-w-none prose-headings:scroll-mt-20 prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:mt-10 prose-h2:text-2xl prose-h3:mt-8 prose-h3:text-xl prose-p:leading-relaxed prose-a:text-foreground prose-a:underline prose-a:underline-offset-4 hover:prose-a:opacity-80 prose-img:rounded-lg prose-img:border prose-img:border-border/40 prose-pre:rounded-lg prose-pre:border prose-pre:border-border/40 prose-code:rounded prose-code:bg-muted/40 prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none sm:prose-base",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug]}
      >
        {content}
      </ReactMarkdown>
    </article>
  )
}
