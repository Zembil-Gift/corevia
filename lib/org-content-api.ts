/**
 * Server-side fetchers for the per-organization public browse pages (`/o/{slug}`).
 * Unlike lib/jobs-api / blog-api / events-api (which are pinned to a single
 * NEXT_PUBLIC_ORG_SLUG), every function here takes the org slug explicitly so one
 * deployment can surface any organization's public content by URL.
 */
import type { JobApi } from "@/lib/jobs-api"
import type { BlogPostApi } from "@/lib/blog-api"
import type { EventApi } from "@/lib/events-api"

const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export interface OrgInfo {
  name: string
  slug: string
  plan: string
}

interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
}

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json() as Promise<T>
}

/** Resolve an org by slug. Returns null if it does not exist or is suspended. */
export function fetchOrgInfo(slug: string): Promise<OrgInfo | null> {
  return getJson<OrgInfo>(`${CMS_BASE_URL}/public/${encodeURIComponent(slug)}`)
}

export async function fetchOrgJobs(slug: string, size = 100): Promise<JobApi[]> {
  const data = await getJson<Page<JobApi>>(
    `${CMS_BASE_URL}/public/${encodeURIComponent(slug)}/jobs?page=0&size=${size}&sortBy=createdAt&direction=desc`
  )
  return data?.content ?? []
}

export function fetchOrgJobBySlug(slug: string, jobSlug: string): Promise<JobApi | null> {
  return getJson<JobApi>(
    `${CMS_BASE_URL}/public/${encodeURIComponent(slug)}/jobs/${encodeURIComponent(jobSlug)}`
  )
}

export async function fetchOrgBlogs(slug: string, size = 100): Promise<BlogPostApi[]> {
  const data = await getJson<Page<BlogPostApi>>(
    `${CMS_BASE_URL}/public/${encodeURIComponent(slug)}/blogs?page=0&size=${size}&sortBy=publishedAt&direction=desc`
  )
  return data?.content ?? []
}

export function fetchOrgBlogBySlug(slug: string, postSlug: string): Promise<BlogPostApi | null> {
  return getJson<BlogPostApi>(
    `${CMS_BASE_URL}/public/${encodeURIComponent(slug)}/blogs/${encodeURIComponent(postSlug)}`
  )
}

export async function fetchOrgEvents(slug: string, size = 100): Promise<EventApi[]> {
  const data = await getJson<Page<EventApi>>(
    `${CMS_BASE_URL}/public/${encodeURIComponent(slug)}/events?page=0&size=${size}&sortBy=startDate&direction=desc`
  )
  return data?.content ?? []
}

export function fetchOrgEventBySlug(slug: string, eventSlug: string): Promise<EventApi | null> {
  return getJson<EventApi>(
    `${CMS_BASE_URL}/public/${encodeURIComponent(slug)}/events/${encodeURIComponent(eventSlug)}`
  )
}
