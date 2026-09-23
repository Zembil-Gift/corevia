"use client"

import { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLang, pick } from "@/lib/i18n"
import { a } from "@/lib/i18n-admin"
import type { EventTypeApi, EventStatusApi } from "@/lib/events-api"
import { ImageUpload } from "@/components/admin/image-upload"

const EVENT_TYPES: EventTypeApi[] = ["ONLINE", "IN_PERSON"]
const STATUS_OPTIONS: EventStatusApi[] = ["DRAFT", "PUBLISHED"]

const c = {
  createEvent: { en: "Create event", am: "ዝግጅት ፍጠር" },
  titlePlaceholder: { en: "Event title", am: "የዝግጅት ርዕስ" },
  descPlaceholder: { en: "Event description...", am: "የዝግጅት መግለጫ..." },
  eventType: { en: "Event type", am: "የዝግጅት አይነት" },
  online: { en: "Online", am: "በመስመር ላይ" },
  inPerson: { en: "In-person", am: "በአካል" },
  locationPlaceholder: { en: "e.g. Online (Zoom) or City, Country", am: "ለምሳሌ በመስመር (Zoom) ወይም ከተማ፣ አገር" },
  startLabel: { en: "Start date & time", am: "የመጀመሪያ ቀን እና ሰዓት" },
  endLabel: { en: "End date & time", am: "የመጨረሻ ቀን እና ሰዓት" },
  registrationUrl: { en: "Registration URL", am: "የምዝገባ URL" },
  failed: { en: "Failed to create event", am: "ዝግጅት መፍጠር አልተሳካም" },
}

/** Convert datetime-local value to ISO string for API */
function toISOString(localDateTime: string): string {
  if (!localDateTime) return ""
  return new Date(localDateTime).toISOString()
}

interface CreateEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateEventModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateEventModalProps) {
  const { lang } = useLang()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
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
        setError((data as { error?: string }).error ?? pick(lang, c.failed))
        setSubmitting(false)
        return
      }
      setTitle("")
      setSlug("")
      setDescription("")
      setEventType("ONLINE")
      setLocation("")
      setStartDateTime("")
      setEndDateTime("")
      setRegistrationUrl("")
      setCoverImageUrl("")
      setStatus("DRAFT")
      onOpenChange(false)
      onSuccess?.()
    } catch {
      setError(pick(lang, a.somethingWrong))
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
              {pick(lang, c.createEvent)}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label={pick(lang, a.close)}
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title" className="text-zinc-200">{pick(lang, a.title)}</Label>
              <Input
                id="event-title"
                type="text"
                placeholder={pick(lang, c.titlePlaceholder)}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-slug" className="text-zinc-200">{pick(lang, a.slug)}</Label>
              <Input
                id="event-slug"
                type="text"
                placeholder="event-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description" className="text-zinc-200">{pick(lang, a.description)}</Label>
              <textarea
                id="event-description"
                required
                rows={3}
                placeholder={pick(lang, c.descPlaceholder)}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20 resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-type" className="text-zinc-200">{pick(lang, c.eventType)}</Label>
              <select
                id="event-type"
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventTypeApi)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20"
              >
                <option value="ONLINE">{pick(lang, c.online)}</option>
                <option value="IN_PERSON">{pick(lang, c.inPerson)}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-location" className="text-zinc-200">{pick(lang, a.location)}</Label>
              <Input
                id="event-location"
                type="text"
                placeholder={pick(lang, c.locationPlaceholder)}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-start" className="text-zinc-200">{pick(lang, c.startLabel)}</Label>
                <Input
                  id="event-start"
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end" className="text-zinc-200">{pick(lang, c.endLabel)}</Label>
                <Input
                  id="event-end"
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-registration" className="text-zinc-200">{pick(lang, c.registrationUrl)}</Label>
              <Input
                id="event-registration"
                type="url"
                placeholder="https://..."
                value={registrationUrl}
                onChange={(e) => setRegistrationUrl(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <ImageUpload target="event-cover" value={coverImageUrl} onChange={setCoverImageUrl} />


            <div className="space-y-2">
              <Label htmlFor="event-status" className="text-zinc-200">{pick(lang, a.status)}</Label>
              <select
                id="event-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatusApi)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {pick(lang, s === "DRAFT" ? a.draft : a.published)}
                  </option>
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
                    {pick(lang, a.creating)}
                  </>
                ) : (
                  pick(lang, c.createEvent)
                )}
              </Button>
              <Dialog.Close asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  {pick(lang, a.cancel)}
                </Button>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
