"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Loader2, Plus, Pencil, Trash2, Building2, Filter } from "lucide-react"
import type { BlogListResponse, BlogPostApi } from "@/lib/blog-api"
import type { SubOrganization } from "@/lib/sub-orgs-api"
import { CreateBlogModal } from "@/components/admin/create-blog-modal"
import { EditBlogModal } from "@/components/admin/edit-blog-modal"
import { Button } from "@/components/ui/button"
import { useLang, pick } from "@/lib/i18n"
import { a } from "@/lib/i18n-admin"

const t = {
  blog: { en: "Blog", am: "ብሎግ" },
  subtitle: { en: "Manage blog posts", am: "የብሎግ ጽሁፎችን ያስተዳድሩ" },
  createBlog: { en: "Create blog", am: "ብሎግ ፍጠር" },
  viewPublic: { en: "View public blog", am: "የህዝብ ብሎግ ይመልከቱ" },
  postsCount: { en: "posts on this page", am: "ጽሁፎች በዚህ ገጽ ላይ" },
  page: { en: "Page", am: "ገጽ" },
  of: { en: "of", am: "ከ" },
  confirmDelete: { en: "Delete", am: "ይሰረዝ" },
  cannotUndo: { en: "This cannot be undone.", am: "ይህ መቀልበስ አይችልም።" },
  failedLoad: { en: "Failed to load posts", am: "ጽሁፎችን መጫን አልተሳካም" },
  failedDelete: { en: "Failed to delete", am: "መሰረዝ አልተሳካም" },
  allBranches: { en: "All Sub-Organizations", am: "ሁሉም ቅርንጫፎች" },
  branch: { en: "Branch", am: "ቅርንጫፍ" },
}

const PAGE_SIZE = 10
const SORT_BY = "createdAt"
const DIRECTION = "desc"

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

export default function AdminBlogPage() {
  const { lang } = useLang()
  const [currentPage, setCurrentPage] = useState(1)
  const [posts, setPosts] = useState<BlogListResponse["content"]>([])
  const [subOrgs, setSubOrgs] = useState<SubOrganization[]>([])
  const [selectedSubOrgId, setSelectedSubOrgId] = useState<string>("")
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editPost, setEditPost] = useState<BlogPostApi | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/admin/sub-organizations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSubOrgs(data)
      })
      .catch(() => {})
  }, [])

  const fetchPosts = useCallback(() => {
    setLoading(true)
    setError(null)
    const pageIndex = currentPage - 1
    const query = new URLSearchParams({
      page: String(pageIndex),
      size: String(PAGE_SIZE),
      sortBy: SORT_BY,
      direction: DIRECTION,
    })
    if (selectedSubOrgId) {
      query.set("subOrganizationId", selectedSubOrgId)
    }
    fetch(`/api/admin/blogs?${query.toString()}`)
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
        setError(err instanceof Error ? err.message : pick(lang, t.failedLoad))
        setPosts([])
        setTotalPages(0)
      })
      .finally(() => setLoading(false))
  }, [currentPage, selectedSubOrgId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const openEditModal = (post: BlogPostApi) => {
    setEditPost(post)
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditPost(null)
  }

  const handleDelete = async (post: BlogPostApi) => {
    if (!confirm(`${pick(lang, t.confirmDelete)} "${post.title}"? ${pick(lang, t.cannotUndo)}`)) return
    setDeletingId(post.id)
    try {
      const res = await fetch(`/api/admin/blogs/${post.id}`, { method: "DELETE" })
      if (res.ok || res.status === 204) {
        fetchPosts()
      } else {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? pick(lang, t.failedDelete))
      }
    } catch {
      setError(pick(lang, t.failedDelete))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{pick(lang, t.blog)}</h1>
          <p className="text-zinc-400 mt-1">{pick(lang, t.subtitle)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {subOrgs.length > 0 && (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
              <Filter className="size-4 text-zinc-400" />
              <select
                value={selectedSubOrgId}
                onChange={(e) => {
                  setSelectedSubOrgId(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-transparent text-sm text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-zinc-900 text-zinc-200">
                  {pick(lang, t.allBranches)}
                </option>
                {subOrgs.map((s) => (
                  <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-200">
                    {s.name} {s.isDefault ? "(Main)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            className="bg-[#e78a53] hover:bg-[#e78a53]/90 text-white"
          >
            <Plus className="size-4 mr-2" />
            {pick(lang, t.createBlog)}
          </Button>
          <Link
            href="/blog"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            {pick(lang, t.viewPublic)}
          </Link>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-400">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-[#e78a53]" aria-hidden />
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, a.title)}</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.branch)}</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, a.date)}</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 w-24">{pick(lang, a.actions)}</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-zinc-800/80 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">{post.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      {post.subOrganizationName ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                          <Building2 className="size-3 text-[#e78a53]" />
                          {post.subOrganizationName}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500">All Branches</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-sm">
                      {formatDate(post.publishedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#e78a53] hover:underline"
                        >
                          {pick(lang, a.view)}
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-zinc-400 hover:text-white p-1 h-8 w-8"
                          onClick={() => openEditModal(post)}
                          aria-label={`${pick(lang, a.edit)} ${post.title}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-zinc-400 hover:text-red-400 p-1 h-8 w-8"
                          onClick={() => handleDelete(post)}
                          disabled={deletingId === post.id}
                          aria-label={`${pick(lang, a.delete)} ${post.title}`}
                        >
                          {deletingId === post.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {posts.length} {pick(lang, t.postsCount)}
            </p>
            {totalPages > 1 && (
              <nav className="flex items-center gap-2" aria-label="Blog pagination">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="px-4 text-sm text-zinc-400">
                  {pick(lang, t.page)} <span className="font-medium text-white">{currentPage}</span> {pick(lang, t.of)}{" "}
                  <span className="font-medium text-white">{totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </nav>
            )}
          </div>
        </>
      )}

      <CreateBlogModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={fetchPosts}
      />
      <EditBlogModal
        open={editModalOpen}
        onOpenChange={(open) => !open && closeEditModal()}
        onSuccess={() => {
          closeEditModal()
          fetchPosts()
        }}
        post={editPost}
      />
    </div>
  )
}
