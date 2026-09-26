import type { Page } from "@/lib/notifications-api"

export type BroadcastInput = {
  subject: string
  body: string
  /** Empty = everyone. Ignored for vice managers (always their branch). */
  subOrganizationIds: number[]
  sendEmail: boolean
}

export type BroadcastPreview = { subject: string; emailHtml: string; bodyHtml: string; recipientCount: number }

export type Broadcast = {
  id: number
  subject: string
  body: string
  bodyHtml: string
  senderName: string
  subOrganizations: { id: number; name: string }[]
  sendEmail: boolean
  recipientCount: number
  readCount: number
  createdAt: string
}

const BASE = "/api/manager/broadcasts"

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Broadcast request failed")
  return data as T
}

const post = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

export const fetchBroadcasts = (page = 0) => request<Page<Broadcast>>(`${BASE}?page=${page}&size=20`)

export const previewBroadcast = (input: BroadcastInput) => request<BroadcastPreview>(`${BASE}/preview`, post(input))

export const sendBroadcast = (input: BroadcastInput) => request<Broadcast>(BASE, post(input))

export const fetchRecipientCount = (subOrganizationIds: number[]) =>
  request<{ count: number }>(
    `${BASE}/recipient-count?${subOrganizationIds.map((id) => `subOrganizationIds=${id}`).join("&")}`,
  ).then((d) => d.count)
