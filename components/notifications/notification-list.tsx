"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationAudience,
} from "@/lib/notifications-api"

const TYPE_LABEL: Record<string, string> = {
  BROADCAST: "Announcement",
  INTERVIEW_INVITATION: "Interview",
  INTERVIEW_CANCELLED: "Interview cancelled",
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

export function NotificationList({ audience }: { audience: NotificationAudience }) {
  const [items, setItems] = useState<AppNotification[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = useCallback(
    async (nextPage: number) => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchNotifications(audience, nextPage)
        setItems((prev) => (nextPage === 0 ? data.content : [...prev, ...data.content]))
        setPage(nextPage)
        setHasMore(nextPage + 1 < data.totalPages)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notifications")
      } finally {
        setLoading(false)
      }
    },
    [audience],
  )

  useEffect(() => {
    load(0)
  }, [load])

  const open = async (n: AppNotification) => {
    setExpanded((current) => (current === n.id ? null : n.id))
    if (n.read) return
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)))
    markNotificationRead(audience, n.id).catch(() => {})
  }

  const readAll = async () => {
    try {
      await markAllNotificationsRead(audience)
      setItems((prev) => prev.map((i) => ({ ...i, read: true })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark notifications as read")
    }
  }

  const unread = items.some((i) => !i.read)

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Bell className="size-4" aria-hidden /> Notifications
        </h2>
        <Button type="button" size="sm" variant="ghost" disabled={!unread} onClick={readAll} className="text-zinc-300">
          <CheckCheck className="size-4" /> Mark all as read
        </Button>
      </div>

      {error && <p className="px-4 py-3 text-sm text-red-400">{error}</p>}

      {!loading && items.length === 0 && !error && (
        <p className="px-4 py-10 text-center text-sm text-zinc-500">You have no notifications yet.</p>
      )}

      <ul className="divide-y divide-zinc-800">
        {items.map((n) => {
          const isOpen = expanded === n.id
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => open(n)}
                aria-expanded={isOpen}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-800/40"
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"}`}
                  aria-label={n.read ? undefined : "Unread"}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className={`truncate text-sm ${n.read ? "text-zinc-300" : "font-semibold text-white"}`}>{n.title}</span>
                    <span className="shrink-0 text-xs text-zinc-500">{formatDate(n.createdAt)}</span>
                  </span>
                  <span className="text-xs text-zinc-500">{TYPE_LABEL[n.type] ?? n.type}</span>
                </span>
              </button>
              {isOpen && (
                <div className="px-9 pb-4">
                  <div
                    className="rich-text text-sm leading-relaxed text-zinc-300"
                    // bodyHtml is escaped + whitelisted server-side (SimpleMarkdown).
                    dangerouslySetInnerHTML={{ __html: n.bodyHtml }}
                  />
                  {n.link && (
                    <Link href={n.link} className="mt-3 inline-block text-sm text-primary underline underline-offset-2">
                      Open
                    </Link>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-primary" aria-label="Loading notifications" />
        </div>
      )}
      {hasMore && !loading && (
        <div className="border-t border-zinc-800 p-3 text-center">
          <Button type="button" size="sm" variant="outline" onClick={() => load(page + 1)}>
            Load more
          </Button>
        </div>
      )}
    </section>
  )
}
