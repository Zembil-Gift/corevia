import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { fetchBlogBySlug } from "@/lib/blog-api"
import { Footer } from "@/components/afrodebab/footer"

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchBlogBySlug(slug)
  if (!post) return { title: "Post not found" }
  return {
    title: `${post.title} | AfroDebab Blog`,
    description: post.excerpt,
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params
  const post = await fetchBlogBySlug(slug)

  if (!post) {
    notFound()
  }

  const imageUrl = post.coverImageUrl || "/placeholder.svg"
  const isExternalImage = imageUrl.startsWith("http")

  return (
    <div className="min-h-screen w-full relative bg-background">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(74, 148, 115, 0.08), transparent 60%)",
        }}
      />

      {/* Header */}
      <header className="sticky top-4 z-[9999] mx-auto flex w-full flex-row items-center justify-between rounded-full bg-background/90 backdrop-blur-md border border-border/50 shadow-lg max-w-5xl px-4 py-2 mt-4">
        <Link
          className="flex items-center justify-center gap-3"
          href="/"
        >
          <Image
            src="/afrodebab-logo.png"
            alt="AfroDebab"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="font-semibold text-foreground tracking-tight">
            AfroDebab
          </span>
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Blog
        </Link>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12 md:py-16">
        <article>
          <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden bg-muted/30 mb-8">
            <Image
              src={imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
              unoptimized={isExternalImage}
            />
          </div>
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            </div>
          </header>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <div
              className="text-foreground/90 text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>

        <div className="mt-12 pt-8 border-t border-border/50">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            <ArrowLeft className="size-4" />
            View all posts
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
