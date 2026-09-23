const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const ORG_SLUG = process.env.NEXT_PUBLIC_ORG_SLUG ?? "afrodebab"

export interface BlogPostApi {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  coverImageUrl: string
  publishedAt: string
  status?: "PUBLISHED" | "DRAFT"
}

export interface BlogListResponse {
  content: BlogPostApi[]
  empty: boolean
  first: boolean
  last: boolean
  number: number
  numberOfElements: number
  pageable: {
    offset: number
    pageNumber: number
    pageSize: number
    paged: boolean
    sort: { empty: boolean; sorted: boolean; unsorted: boolean }
    unpaged: boolean
  }
  size: number
  sort: { empty: boolean; sorted: boolean; unsorted: boolean }
  totalElements: number
  totalPages: number
}

export type BlogSortBy = "publishedAt" | "title" | "createdAt" | string
export type BlogSortDirection = "asc" | "desc"

export interface FetchBlogListParams {
  page?: number
  size?: number
  sortBy?: BlogSortBy
  direction?: BlogSortDirection
}

export async function fetchBlogList(
  page: number = 0,
  size: number = 6,
  sortBy?: BlogSortBy,
  direction?: BlogSortDirection
): Promise<BlogListResponse> {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("size", String(size))
  if (sortBy) params.set("sortBy", sortBy)
  if (direction) params.set("direction", direction)
  const url = `${CMS_BASE_URL}/public/${ORG_SLUG}/blogs?${params.toString()}`
  const res = await fetch(url, {
    next: { revalidate: 60 },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch blog list: ${res.status}`)
  }
  return res.json()
}

export async function fetchBlogBySlug(slug: string): Promise<BlogPostApi | null> {
  const url = `${CMS_BASE_URL}/public/${ORG_SLUG}/blogs/${encodeURIComponent(slug)}`
  const res = await fetch(url, {
    next: { revalidate: 60 },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`Failed to fetch blog: ${res.status}`)
  }
  return res.json()
}
