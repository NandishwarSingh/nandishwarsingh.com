import { notFound } from "next/navigation"
import { posts } from "@/lib/db"
import { PostEditor } from "@/components/admin/PostEditor"

export const dynamic = "force-dynamic"

type Params = { slug: string }

export default async function EditBlogPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const ps = await posts()
  const post = await ps.findOne({ slug })
  if (!post) notFound()

  return (
    <PostEditor
      initial={{
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        body: post.body,
        coverImage: post.coverImage ?? "",
        tags: post.tags,
        status: post.status,
        seo: {
          metaTitle: post.seo?.metaTitle,
          metaDescription: post.seo?.metaDescription,
          keywords: post.seo?.keywords ?? [],
          canonicalUrl: post.seo?.canonicalUrl,
          ogImage: post.seo?.ogImage,
        },
      }}
    />
  )
}
