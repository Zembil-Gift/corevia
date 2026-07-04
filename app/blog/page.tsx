"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import type { BlogListResponse } from "@/lib/blog-api"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/afrodebab/footer"

const PAGE_SIZE = 6
const DEFAULT_SORT_BY = "publishedAt"
const DEFAULT_DIRECTION = "desc"

export default function BlogPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [posts, setPosts] = useState<BlogListResponse["content"]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const pageIndex = currentPage - 1
    const query = new URLSearchParams({
      page: String(pageIndex),
      size: String(PAGE_SIZE),
      sortBy: DEFAULT_SORT_BY,
      direction: DEFAULT_DIRECTION,
    })
    fetch(`/api/blogs?${query.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error((body as { error?: string }).error ?? `Failed to load: ${res.status}`)
        }
        return res.json() as Promise<BlogListResponse>
      })
      .then((data) => {
        setPosts(data.content ?? [])
        setTotalPages(data.totalPages ?? 0)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load posts")
        setPosts([])
        setTotalPages(0)
      })
      .finally(() => setLoading(false))
  }, [currentPage])

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
          href="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Home
        </Link>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3">
            Blog
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Insights on Pan-African tech, product building, and connecting
            markets.
          </p>
        </div>

        {error && (
          <div className="text-center py-12 text-destructive font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
          </div>
        ) : (
          <>
            {/* Card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="group flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                >
                  <Link href={`/blog/${post.slug}`} className="flex flex-col flex-1">
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/30">
                      <Image
                        src={post.coverImageUrl || "/placeholder.svg"}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized={post.coverImageUrl?.startsWith("http")}
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5 md:p-6">
                      <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground text-sm md:text-base line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>
                      <span className="inline-flex items-center gap-2 mt-4 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                        Read full article
                        <ArrowRight className="size-4 shrink-0" />
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {posts.length === 0 && !error && (
              <p className="text-center text-muted-foreground py-12">
                No posts yet. Check back soon.
              </p>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-2 mt-12 md:mt-16"
                aria-label="Blog pagination"
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="rounded-full"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="flex items-center gap-1 px-4 text-sm text-muted-foreground">
                  Page{" "}
                  <span className="font-medium text-foreground">{currentPage}</span>{" "}
                  of <span className="font-medium text-foreground">{totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="rounded-full"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </nav>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
