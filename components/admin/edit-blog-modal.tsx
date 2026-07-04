"use client"

import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BlogPostApi } from "@/lib/blog-api"

interface EditBlogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  post: BlogPostApi | null
}

export function EditBlogModal({
  open,
  onOpenChange,
  onSuccess,
  post,
}: EditBlogModalProps) {
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT">("PUBLISHED")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (post && open) {
      setTitle(post.title ?? "")
      setSlug(post.slug ?? "")
      setExcerpt(post.excerpt ?? "")
      setContent(post.content ?? "")
      setCoverImageUrl(post.coverImageUrl ?? "")
      setStatus("PUBLISHED")
      setError("")
    }
  }, [post, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!post) return
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/blogs/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim(),
          content: content.trim(),
          coverImageUrl: coverImageUrl.trim(),
          status,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to update blog")
        setSubmitting(false)
        return
      }
      onOpenChange(false)
      onSuccess?.()
    } catch {
      setError("Something went wrong")
    }
    setSubmitting(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && !submitting) {
      setError("")
    }
    onOpenChange(next)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[10001] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-white">
              Edit blog post
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-blog-title" className="text-zinc-200">
                Title
              </Label>
              <Input
                id="edit-blog-title"
                type="text"
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-blog-slug" className="text-zinc-200">
                Slug
              </Label>
              <Input
                id="edit-blog-slug"
                type="text"
                placeholder="sample-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-blog-excerpt" className="text-zinc-200">
                Excerpt
              </Label>
              <Input
                id="edit-blog-excerpt"
                type="text"
                placeholder="Short summary..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-blog-content" className="text-zinc-200">
                Content
              </Label>
              <textarea
                id="edit-blog-content"
                rows={4}
                placeholder="Post content (HTML or plain text)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20 resize-y min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-blog-cover" className="text-zinc-200">
                Cover image URL
              </Label>
              <Input
                id="edit-blog-cover"
                type="url"
                placeholder="https://..."
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-blog-status" className="text-zinc-200">
                Status
              </Label>
              <select
                id="edit-blog-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "PUBLISHED" | "DRAFT")}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20"
              >
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#e78a53] hover:bg-[#e78a53]/90 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              <Dialog.Close asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
