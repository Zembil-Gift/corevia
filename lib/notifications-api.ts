export type AppNotification = {
  id: number
  type: string
  title: string
  /** Sanitized server-side (escaped markdown subset); safe to render as HTML. */
  bodyHtml: string
  link: string | null
  read: boolean
  createdAt: string
}

export type Page<T> = { content: T[]; totalElements: number; totalPages: number; number: number }

/** The employee portal and the manager dashboard hit different proxies with the same API shape. */
export type NotificationAudience = "employee" | "manager"

const BASE: Record<NotificationAudience, string> = {
  employee: "/api/employee/me/notifications",
  manager: "/api/manager/notifications",
}

// Fired after anything changes the unread count so badges refresh without waiting for the poll.
export const NOTIFICATIONS_CHANGED = "notifications-changed"

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Notification request failed")
  return data as T
}

export const fetchNotifications = (audience: NotificationAudience, page = 0) =>
  request<Page<AppNotification>>(`${BASE[audience]}?page=${page}&size=20`)

export const fetchUnreadCount = (audience: NotificationAudience) =>
  request<{ count: number }>(`${BASE[audience]}/unread-count`).then((d) => d.count)

export async function markNotificationRead(audience: NotificationAudience, id: number) {
  const updated = await request<AppNotification>(`${BASE[audience]}/${id}/read`, { method: "POST" })
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
  return updated
}

export async function markAllNotificationsRead(audience: NotificationAudience) {
  await request(`${BASE[audience]}/read-all`, { method: "POST" })
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
}
