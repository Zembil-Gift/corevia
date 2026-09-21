"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Loader2, Plus, Pencil, Building2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLang, pick } from "@/lib/i18n"
import { a } from "@/lib/i18n-admin"
import { formatEventDateShort } from "@/lib/event-data"
import type { EventApi } from "@/lib/events-api"
import type { SubOrganization } from "@/lib/sub-orgs-api"
import { CreateEventModal } from "@/components/admin/create-event-modal"
import { EditEventModal } from "@/components/admin/edit-event-modal"

const t = {
  events: { en: "Events", am: "ዝግጅቶች" },
  subtitle: { en: "Manage events", am: "ዝግጅቶችን ያስተዳድሩ" },
  createEvent: { en: "Create event", am: "ዝግጅት ፍጠር" },
  viewPublic: { en: "View public events", am: "የህዝብ ዝግጅቶችን ይመልከቱ" },
  type: { en: "Type", am: "አይነት" },
  online: { en: "Online", am: "በመስመር ላይ" },
  inPerson: { en: "In-person", am: "በአካል" },
  eventsCount: { en: "events", am: "ዝግጅቶች" },
  failedLoad: { en: "Failed to load events", am: "ዝግጅቶችን መጫን አልተሳካም" },
  allBranches: { en: "All Sub-Organizations", am: "ሁሉም ቅርንጫፎች" },
  branch: { en: "Branch", am: "ቅርንጫፍ" },
}

export default function AdminEventsPage() {
  const { lang } = useLang()
  const [events, setEvents] = useState<EventApi[]>([])
  const [subOrgs, setSubOrgs] = useState<SubOrganization[]>([])
  const [selectedSubOrgId, setSelectedSubOrgId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<EventApi | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    fetch("/api/admin/sub-organizations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSubOrgs(data)
      })
      .catch(() => {})
  }, [])

  const fetchEventsList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = selectedSubOrgId
        ? `/api/admin/events?subOrganizationId=${selectedSubOrgId}&page=0&size=100&sortBy=startDate&direction=desc`
        : `/api/admin/events?page=0&size=100&sortBy=startDate&direction=desc`
      const res = await fetch(url)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { message?: string }).message ?? `Failed to load: ${res.status}`)
      }
      const data = await res.json()
      setEvents(data.content ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : pick(lang, t.failedLoad))
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [selectedSubOrgId])

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
          <h1 className="text-2xl font-bold text-white">{pick(lang, t.events)}</h1>
          <p className="text-zinc-400 mt-1">{pick(lang, t.subtitle)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {subOrgs.length > 0 && (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
              <Filter className="size-4 text-zinc-400" />
              <select
                value={selectedSubOrgId}
                onChange={(e) => setSelectedSubOrgId(e.target.value)}
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
            onClick={() => setCreateModalOpen(true)}
            className="bg-[#e78a53] hover:bg-[#e78a53]/90 text-white"
          >
            <Plus className="size-4 mr-2" />
            {pick(lang, t.createEvent)}
          </Button>
          <Link
            href="/events"
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
        <div className="flex justify-center py-16">
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
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.type)}</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, a.date)}</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, a.status)}</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 w-24">{pick(lang, a.actions)}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-zinc-800/80 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">{event.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      {event.subOrganizationName ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                          <Building2 className="size-3 text-[#e78a53]" />
                          {event.subOrganizationName}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500">All Branches</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {pick(lang, event.eventType === "ONLINE" ? t.online : t.inPerson)}
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
                        {pick(lang, event.status === "PUBLISHED" ? a.published : a.draft)}
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
                          {pick(lang, a.view)}
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-zinc-400 hover:text-white p-1 h-8 w-8"
                          onClick={() => openEditModal(event)}
                          aria-label={`${pick(lang, a.edit)} ${event.title}`}
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
            {events.length} {pick(lang, t.eventsCount)}
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
