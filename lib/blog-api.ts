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
