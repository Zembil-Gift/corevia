const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!
const ORG_SLUG = process.env.NEXT_PUBLIC_ORG_SLUG ?? "afrodebab"

export type EventTypeApi = "ONLINE" | "IN_PERSON"
export type EventStatusApi = "DRAFT" | "PUBLISHED"

export interface EventApi {
  id: number
  title: string
  slug: string
  description: string
  eventType: EventTypeApi
  location: string
  startDate: string
  endDate: string
  registrationUrl: string
  coverImageUrl?: string
  status: EventStatusApi
  subOrganizationId?: number | null
  subOrganizationName?: string | null
}

export interface EventListResponse {
  content: EventApi[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
  sort: { empty: boolean; sorted: boolean; unsorted: boolean }
  pageable: {
    offset: number
    sort: { empty: boolean; sorted: boolean; unsorted: boolean }
    unpaged: boolean
    paged: boolean
    pageNumber: number
    pageSize: number
  }
}

export type EventSortBy = "startDate" | "endDate" | "title" | "createdAt" | string
export type EventSortDirection = "asc" | "desc"

export interface FetchEventsParams {
  page?: number
  size?: number
  sortBy?: EventSortBy
  direction?: EventSortDirection
}

/** Fetch paginated events. Page is 0-based in the API. */
export async function fetchEvents(
  page: number = 0,
  size: number = 6,
  sortBy?: EventSortBy,
  direction?: EventSortDirection
): Promise<EventListResponse> {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("size", String(size))
  if (sortBy) params.set("sortBy", sortBy)
  if (direction) params.set("direction", direction)
  const url = `${CMS_BASE_URL}/public/${ORG_SLUG}/events?${params.toString()}`
  const res = await fetch(url, {
    next: { revalidate: 60 },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.status}`)
  }
  return res.json()
}

/** Fetch a single event by slug. */
export async function fetchEventBySlug(slug: string): Promise<EventApi | null> {
  const url = `${CMS_BASE_URL}/public/${ORG_SLUG}/events/${encodeURIComponent(slug)}`
  const res = await fetch(url, {
    next: { revalidate: 60 },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`Failed to fetch event: ${res.status}`)
  }
  return res.json()
}

/** Normalize eventType for display (online | in-person). */
export function isEventOnline(event: EventApi): boolean {
  return event.eventType === "ONLINE"
}

/** Whether to show event in public list (only published). */
export function isEventPublished(event: EventApi): boolean {
  return event.status === "PUBLISHED"
}
