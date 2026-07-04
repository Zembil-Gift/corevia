import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { fetchOrgBlogBySlug } from "@/lib/org-content-api"

export default async function OrgBlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string; postSlug: string }>
}) {
  const { slug, postSlug } = await params
  const post = await fetchOrgBlogBySlug(slug, postSlug)
  if (!post) notFound()

  return (
    <article className="max-w-2xl">
      <Link
        href={`/o/${slug}/blog`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All articles
      </Link>

      {post.publishedAt && (
        <p className="mt-4 text-xs text-muted-foreground">
          {new Date(post.publishedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{post.title}</h1>
      {post.excerpt && <p className="mt-2 text-base text-muted-foreground">{post.excerpt}</p>}

      {post.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImageUrl}
          alt=""
          className="mt-6 w-full rounded-xl object-cover"
        />
      )}

      <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {post.content}
      </div>
    </article>
  )
}
