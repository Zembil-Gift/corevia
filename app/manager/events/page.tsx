"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Loader2, Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatEventDateShort } from "@/lib/event-data"
import type { EventApi } from "@/lib/events-api"
import { CreateEventModal } from "@/components/admin/create-event-modal"
import { EditEventModal } from "@/components/admin/edit-event-modal"

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<EventApi | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const fetchEventsList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/events?page=0&size=100&sortBy=startDate&direction=desc")
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { message?: string }).message ?? `Failed to load: ${res.status}`)
      }
      const data = await res.json()
      setEvents(data.content ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events")
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEventsList()
  }, [fetchEventsList])

  const openEditModal = (event: EventApi) => {
    setEditEvent(event)
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditEvent(null)
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-zinc-400 mt-1">Manage events</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="bg-[#e78a53] hover:bg-[#e78a53]/90 text-white"
          >
            <Plus className="size-4 mr-2" />
            Create event
          </Button>
          <Link
            href="/events"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            View public events
          </Link>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-400">{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-[#e78a53]" aria-hidden />
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Title</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Type</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Date</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-zinc-800/80 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">{event.title}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {event.eventType === "ONLINE" ? "Online" : "In-person"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-sm">{formatEventDateShort(event.startDate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          event.status === "PUBLISHED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/events/${event.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#e78a53] hover:underline"
                        >
                          View
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-zinc-400 hover:text-white p-1 h-8 w-8"
                          onClick={() => openEditModal(event)}
                          aria-label={`Edit ${event.title}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </p>
        </>
      )}

      <CreateEventModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchEventsList}
      />
      <EditEventModal
        open={editModalOpen}
        onOpenChange={(open) => !open && closeEditModal()}
        onSuccess={() => {
          closeEditModal()
          fetchEventsList()
        }}
        event={editEvent}
      />
    </div>
  )
}
