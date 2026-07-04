"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FailedEmailNotificationsResponse } from "@/lib/job-applications-api"

export default function AdminEmailNotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [data, setData] = useState<FailedEmailNotificationsResponse>({
    content: [],
    page: { size: 10, number: 0, totalElements: 0, totalPages: 0 },
  })

  const fetchFailedNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("size", "10")
      params.set("sortBy", "createdAt")
      params.set("direction", "desc")
      const res = await fetch(`/api/admin/email-notifications/failed?${params.toString()}`, {
        cache: "no-store",
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? "Failed to load failed notifications")
      }
      const payload = (await res.json()) as FailedEmailNotificationsResponse
      setData({
        content: Array.isArray(payload.content) ? payload.content : [],
        page: payload.page ?? { size: 10, number: page, totalElements: 0, totalPages: 0 },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load failed notifications")
      setData({
        content: [],
        page: { size: 10, number: page, totalElements: 0, totalPages: 0 },
      })
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchFailedNotifications()
  }, [fetchFailedNotifications])

  const handleRetry = async (id: number) => {
    setRetryingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/email-notifications/${id}/retry`, {
        method: "POST",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((body as { error?: string }).error ?? "Failed to retry notification")
      }
      await fetchFailedNotifications()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retry notification")
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Failed Email Notifications</h1>
        <p className="mt-1 text-zinc-400">Retry failed hiring and payroll related notifications.</p>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-[#e78a53]" aria-hidden />
        </div>
      ) : data.content.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-zinc-400">
          No failed notifications found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Type</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Recipient</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Subject</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Attempts</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Last Error</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((notification) => (
                <tr key={notification.id} className="border-b border-zinc-800/80 align-top last:border-0">
                  <td className="px-4 py-3 text-zinc-300">{notification.type}</td>
                  <td className="px-4 py-3 text-zinc-300">{notification.recipientEmail}</td>
                  <td className="px-4 py-3 text-zinc-300">{notification.subject}</td>
                  <td className="px-4 py-3 text-zinc-300">{notification.attemptCount}</td>
                  <td className="px-4 py-3 text-red-300">{notification.lastError ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      onClick={() => handleRetry(notification.id)}
                      disabled={retryingId === notification.id}
                      className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                    >
                      {retryingId === notification.id ? "Retrying..." : "Retry"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
        <span>
          Page {data.page.number + 1} of {Math.max(data.page.totalPages, 1)}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 0 || loading}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading || page + 1 >= data.page.totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
