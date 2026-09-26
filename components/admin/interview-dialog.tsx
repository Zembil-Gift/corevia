"use client"

import { useEffect, useMemo, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Loader2, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchGoogleConnection } from "@/lib/google-connect-api"
import {
  fetchParticipantOptions,
  rescheduleInterview,
  scheduleInterview,
  type Interview,
  type InterviewMode,
  type ParticipantOption,
  type ParticipantOptions,
} from "@/lib/interviews-api"

const DURATIONS = [30, 45, 60, 90, 120]

const pad = (n: number) => String(n).padStart(2, "0")
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: number
  candidateName: string
  /** Present when rescheduling. */
  interview?: Interview | null
  onSaved: (interview: Interview) => void
}

export function InterviewDialog({ open, onOpenChange, applicationId, candidateName, interview, onSaved }: Props) {
  const [options, setOptions] = useState<ParticipantOptions | null>(null)
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("10:00")
  const [duration, setDuration] = useState(60)
  const [mode, setMode] = useState<InterviewMode>("ONLINE")
  const [location, setLocation] = useState("")
  const [meetingUrl, setMeetingUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [managerIds, setManagerIds] = useState<number[]>([])
  const [employeeIds, setEmployeeIds] = useState<number[]>([])
  const [externals, setExternals] = useState<{ name: string; email: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    fetchGoogleConnection()
      .then((c) => setCalendarConnected(c.calendar))
      .catch(() => setCalendarConnected(false))
    const me: Promise<{ email?: string } | null> = interview
      ? Promise.resolve(null)
      : fetch("/api/manager/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    Promise.all([fetchParticipantOptions(), me])
      .then(([loaded, self]) => {
        setOptions(loaded)
        // The scheduling manager is on the panel by default.
        const selfOption = self?.email && loaded.managers.find((m) => m.email.toLowerCase() === self.email!.toLowerCase())
        if (!interview) setManagerIds(selfOption ? [selfOption.id] : [])
      })
      .catch((e: Error) => setError(e.message))

    if (interview) {
      const start = new Date(interview.startAt)
      setDate(localDate(start))
      setTime(localTime(start))
      setDuration(Math.round((new Date(interview.endAt).getTime() - start.getTime()) / 60000))
      setMode(interview.mode)
      setLocation(interview.location ?? "")
      setMeetingUrl(interview.meetingUrl ?? "")
      setNotes(interview.notes ?? "")
      setManagerIds(interview.participants.flatMap((p) => (p.managerId ? [p.managerId] : [])))
      setEmployeeIds(interview.participants.flatMap((p) => (p.employeeId ? [p.employeeId] : [])))
      setExternals(interview.participants.filter((p) => p.kind === "EXTERNAL").map((p) => ({ name: p.name ?? "", email: p.email })))
      return
    }
    setDate(localDate(new Date(Date.now() + 86400000)))
    setTime("10:00")
    setDuration(60)
    setMode("ONLINE")
    setLocation("")
    setMeetingUrl("")
    setNotes("")
    setEmployeeIds([])
    setExternals([])
  }, [open, interview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const start = new Date(`${date}T${time}`)
    if (Number.isNaN(start.getTime())) {
      setError("Pick a valid date and time")
      return
    }
    const input = {
      startAt: start.toISOString(),
      endAt: new Date(start.getTime() + duration * 60000).toISOString(),
      mode,
      location: mode === "IN_PERSON" ? location : "",
      meetingUrl: mode === "ONLINE" ? meetingUrl : "",
      notes,
      managerIds,
      employeeIds,
      externalInvitees: externals.filter((x) => x.email.trim()),
    }
    setSaving(true)
    setError(null)
    try {
      onSaved(interview ? await rescheduleInterview(interview.id, input) : await scheduleInterview(applicationId, input))
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save interview")
    } finally {
      setSaving(false)
    }
  }

  const delivery = calendarConnected
    ? interview && !interview.googleCalendarEvent
      ? "Updates are emailed with a calendar attachment, like the original invitation."
      : `Added to your Google Calendar. Google sends the invitations${mode === "ONLINE" && !meetingUrl ? " with a Meet link" : ""}.`
    : "Invitations are emailed with a calendar attachment. Connect Google Calendar in Integrations to send them from your calendar with a Meet link."

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[10001] max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <Dialog.Title className="text-lg font-semibold text-white">
              {interview ? "Reschedule interview" : "Schedule interview"} · {candidateName}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="iv-date">Date</Label>
                <Input id="iv-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="iv-time">Start time</Label>
                <Input id="iv-time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="iv-duration">Duration</Label>
                <select
                  id="iv-duration"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm dark:bg-input/30"
                >
                  {[...new Set([...DURATIONS, duration])].sort((a, b) => a - b).map((m) => (
                    <option key={m} value={m}>
                      {m} minutes
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="-mt-3 text-xs text-zinc-500">Times are in your browser&apos;s time zone.</p>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-zinc-200">Format</legend>
              <div className="flex gap-4 text-sm text-zinc-300">
                {(["ONLINE", "IN_PERSON"] as const).map((m) => (
                  <label key={m} className="flex items-center gap-2">
                    <input type="radio" name="iv-mode" checked={mode === m} onChange={() => setMode(m)} />
                    {m === "ONLINE" ? "Online" : "In person"}
                  </label>
                ))}
              </div>
              {mode === "ONLINE" ? (
                <Input
                  aria-label="Meeting link"
                  type="url"
                  placeholder={calendarConnected ? "Leave empty to create a Google Meet link" : "Meeting link (Zoom, Meet, Teams…)"}
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                />
              ) : (
                <Input aria-label="Location" placeholder="Office address or room" value={location} onChange={(e) => setLocation(e.target.value)} />
              )}
            </fieldset>

            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-200">Interviewers</p>
              {!options ? (
                <Loader2 className="size-5 animate-spin text-zinc-500" aria-label="Loading people" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <PeoplePicker label="Managers" people={options.managers} selected={managerIds} onChange={setManagerIds} />
                  <PeoplePicker label="Employees" people={options.employees} selected={employeeIds} onChange={setEmployeeIds} />
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-400">Invite by email</p>
                {externals.map((x, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      aria-label="Name"
                      placeholder="Name (optional)"
                      value={x.name}
                      onChange={(e) => setExternals((prev) => prev.map((p, j) => (j === i ? { ...p, name: e.target.value } : p)))}
                    />
                    <Input
                      aria-label="Email"
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={x.email}
                      onChange={(e) => setExternals((prev) => prev.map((p, j) => (j === i ? { ...p, email: e.target.value } : p)))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove invitee"
                      onClick={() => setExternals((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setExternals((prev) => [...prev, { name: "", email: "" }])}>
                  <Plus className="size-4" /> Add person
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="iv-notes">Notes for interviewers</Label>
              <textarea
                id="iv-notes"
                rows={3}
                maxLength={5000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
              />
              <p className="text-xs text-zinc-500">Only interviewers see these. The candidate never does.</p>
            </div>

            <p className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-xs text-zinc-400">{delivery}</p>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={saving} className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90">
                {saving && <Loader2 className="size-4 animate-spin" />}
                {interview ? "Save and notify" : "Schedule and invite"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function PeoplePicker({
  label,
  people,
  selected,
  onChange,
}: {
  label: string
  people: ParticipantOption[]
  selected: number[]
  onChange: (ids: number[]) => void
}) {
  const [query, setQuery] = useState("")
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? people.filter((p) => `${p.name} ${p.email} ${p.detail ?? ""}`.toLowerCase().includes(q)) : people
  }, [people, query])

  return (
    <div className="rounded-lg border border-zinc-800">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
        <span className="text-xs font-medium text-zinc-400">
          {label}
          {selected.length > 0 && ` · ${selected.length} selected`}
        </span>
      </div>
      <div className="p-2">
        <Input aria-label={`Search ${label.toLowerCase()}`} placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <ul className="max-h-44 overflow-y-auto px-2 pb-2">
        {visible.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-zinc-800/60">
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={(e) => onChange(e.target.checked ? [...selected, p.id] : selected.filter((id) => id !== p.id))}
              />
              <span className="min-w-0">
                <span className="block truncate text-zinc-200">{p.name}</span>
                <span className="block truncate text-xs text-zinc-500">{p.detail || p.email}</span>
              </span>
            </label>
          </li>
        ))}
        {visible.length === 0 && <li className="px-1.5 py-2 text-xs text-zinc-500">No matches</li>}
      </ul>
    </div>
  )
}
