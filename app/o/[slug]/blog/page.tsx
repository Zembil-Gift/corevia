import Link from "next/link"
import { fetchOrgBlogs } from "@/lib/org-content-api"

export default async function OrgBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const posts = await fetchOrgBlogs(slug)

  if (posts.length === 0) {
    return <p className="text-sm text-muted-foreground">No published articles yet.</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/o/${slug}/blog/${post.slug}`}
          className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-emerald-500/40"
        >
          {post.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImageUrl}
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
          ) : (
            <div className="aspect-[16/9] w-full bg-gradient-to-br from-emerald-500/20 to-lime-400/10" />
          )}
          <div className="flex flex-1 flex-col p-5">
            {post.publishedAt && (
              <p className="text-xs text-muted-foreground">
                {new Date(post.publishedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
            <h2 className="mt-1 text-lg font-semibold text-foreground group-hover:text-emerald-300">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
