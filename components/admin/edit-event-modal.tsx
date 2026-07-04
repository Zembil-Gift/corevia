"use client"

import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EventApi, EventTypeApi, EventStatusApi } from "@/lib/events-api"
import { ImageUpload } from "@/components/admin/image-upload"

const EVENT_TYPES: EventTypeApi[] = ["ONLINE", "IN_PERSON"]
const STATUS_OPTIONS: EventStatusApi[] = ["DRAFT", "PUBLISHED"]

function toISOString(localDateTime: string): string {
  if (!localDateTime) return ""
  return new Date(localDateTime).toISOString()
}

/** Convert ISO date string to datetime-local value (yyyy-mm-ddThh:mm) */
function toDateTimeLocal(iso: string): string {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ""
  }
}

interface EditEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  event: EventApi | null
}

export function EditEventModal({
  open,
  onOpenChange,
  onSuccess,
  event,
}: EditEventModalProps) {
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [eventType, setEventType] = useState<EventTypeApi>("ONLINE")
  const [location, setLocation] = useState("")
  const [startDateTime, setStartDateTime] = useState("")
  const [endDateTime, setEndDateTime] = useState("")
  const [registrationUrl, setRegistrationUrl] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [status, setStatus] = useState<EventStatusApi>("DRAFT")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (event && open) {
      setTitle(event.title ?? "")
      setSlug(event.slug ?? "")
      setDescription(event.description ?? "")
      setEventType(event.eventType ?? "ONLINE")
      setLocation(event.location ?? "")
      setStartDateTime(toDateTimeLocal(event.startDate ?? ""))
      setEndDateTime(toDateTimeLocal(event.endDate ?? ""))
      setRegistrationUrl(event.registrationUrl ?? "")
      setCoverImageUrl(event.coverImageUrl ?? "")
      setStatus(event.status ?? "DRAFT")
      setError("")
    }
  }, [event, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim(),
          eventType,
          location: location.trim(),
          startDate: toISOString(startDateTime),
          endDate: toISOString(endDateTime),
          registrationUrl: registrationUrl.trim(),
          coverImageUrl: coverImageUrl.trim(),
          status,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to update event")
        setSubmitting(false)
        return
      }
      onOpenChange(false)
      onSuccess?.()
    } catch {
      setError("Something went wrong")
    }
    setSubmitting(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && !submitting) setError("")
    onOpenChange(next)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[10001] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-white">
              Edit event
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-event-title" className="text-zinc-200">Title</Label>
              <Input
                id="edit-event-title"
                type="text"
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-event-slug" className="text-zinc-200">Slug</Label>
              <Input
                id="edit-event-slug"
                type="text"
                placeholder="event-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-event-description" className="text-zinc-200">Description</Label>
              <textarea
                id="edit-event-description"
                rows={3}
                placeholder="Event description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20 resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-event-type" className="text-zinc-200">Event type</Label>
              <select
                id="edit-event-type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventTypeApi)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20"
              >
                <option value="ONLINE">Online</option>
                <option value="IN_PERSON">In-person</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-event-location" className="text-zinc-200">Location</Label>
              <Input
                id="edit-event-location"
                type="text"
                placeholder="e.g. Online (Zoom) or City, Country"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-event-start" className="text-zinc-200">Start date & time</Label>
                <Input
                  id="edit-event-start"
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-event-end" className="text-zinc-200">End date & time</Label>
                <Input
                  id="edit-event-end"
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-event-registration" className="text-zinc-200">Registration URL</Label>
              <Input
                id="edit-event-registration"
                type="url"
                placeholder="https://..."
                value={registrationUrl}
                onChange={(e) => setRegistrationUrl(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <ImageUpload value={coverImageUrl} onChange={setCoverImageUrl} />

            <div className="space-y-2">
              <Label htmlFor="edit-event-status" className="text-zinc-200">Status</Label>
              <select
                id="edit-event-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatusApi)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#e78a53] hover:bg-[#e78a53]/90 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              <Dialog.Close asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
