"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  fetchEmailSchedule,
  saveEmailSchedule,
  type EmailSchedule as Schedule,
  type EmailScheduleInput,
} from "@/lib/email-templates-api"

const formatIn = (iso: string | null, timeZone: string) =>
  iso
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(iso))
    : "Never"

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export function EmailSchedule() {
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [form, setForm] = useState<EmailScheduleInput | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = (s: Schedule) => {
    setSchedule(s)
    setForm({ dispatchTime: s.dispatchTime, timezone: s.timezone, payrollReminderIntervalDays: s.payrollReminderIntervalDays })
  }

  useEffect(() => {
    fetchEmailSchedule()
      .then(load)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const zones = useMemo(() => {
    // Not in this TS lib yet; older browsers lack it, leaving just UTC, the saved zone and the browser's.
    const supported = (Intl as unknown as { supportedValuesOf?: (key: "timeZone") => string[] }).supportedValuesOf
    const all = new Set<string>(supported?.("timeZone") ?? [])
    all.add(browserZone())
    all.add("UTC")
    if (schedule) all.add(schedule.timezone)
    return [...all].sort()
  }, [schedule])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      </div>
    )
  }
  if (!schedule || !form) {
    return <p className="text-sm text-red-400">{error ?? "Failed to load email schedule"}</p>
  }

  const dirty =
    form.dispatchTime !== schedule.dispatchTime ||
    form.timezone !== schedule.timezone ||
    form.payrollReminderIntervalDays !== schedule.payrollReminderIntervalDays
  const intervalValid =
    Number.isInteger(form.payrollReminderIntervalDays) &&
    form.payrollReminderIntervalDays >= 1 &&
    form.payrollReminderIntervalDays <= 30
  const localZone = browserZone()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      load(await saveEmailSchedule(form))
      setNotice("Schedule saved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save email schedule")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <form onSubmit={handleSave} className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Sending schedule</h2>
          <p className="text-sm text-zinc-500">
            Queued emails (credentials, payments, hiring updates, notifications) go out once a day at this time.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dispatch-time">Daily send time</Label>
          <Input
            id="dispatch-time"
            type="time"
            step={60}
            required
            value={form.dispatchTime}
            onChange={(e) => setForm({ ...form, dispatchTime: e.target.value.slice(0, 5) })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dispatch-zone">Timezone</Label>
          <select
            id="dispatch-zone"
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {zones.map((zone) => (
              <option key={zone} value={zone} className="bg-zinc-900">
                {zone}
              </option>
            ))}
          </select>
          {form.timezone !== localZone && (
            <button
              type="button"
              onClick={() => setForm({ ...form, timezone: localZone })}
              className="text-xs text-primary hover:underline"
            >
              Use my timezone ({localZone})
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reminder-interval">Payroll reminder every (days)</Label>
          <Input
            id="reminder-interval"
            type="number"
            min={1}
            max={30}
            step={1}
            required
            value={Number.isNaN(form.payrollReminderIntervalDays) ? "" : form.payrollReminderIntervalDays}
            onChange={(e) => setForm({ ...form, payrollReminderIntervalDays: e.target.valueAsNumber })}
            aria-invalid={!intervalValid}
          />
          <p className="text-xs text-zinc-500">
            Managers and vice managers are reminded of salary payments due within 3 days, at the send time above.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {notice && <p className="text-sm text-primary">{notice}</p>}

        <Button
          type="submit"
          disabled={saving || !dirty || !intervalValid || !form.dispatchTime}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save schedule
        </Button>
      </form>

      <section aria-label="Saved schedule" className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="text-lg font-semibold text-white">Saved schedule</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Send time">
            {schedule.dispatchTime} {schedule.timezone}
            <span className="block text-zinc-500">= {schedule.dispatchTimeUtc} UTC today</span>
          </Row>
          <Row label="Next email send">
            {formatIn(schedule.nextDispatchAt, schedule.timezone)}
            <span className="block text-zinc-500">{formatIn(schedule.nextDispatchAt, "UTC")} UTC</span>
          </Row>
          <Row label="Next payroll reminder">
            {formatIn(schedule.nextPayrollReminderAt, schedule.timezone)}
            <span className="block text-zinc-500">
              every {schedule.payrollReminderIntervalDays} day{schedule.payrollReminderIntervalDays === 1 ? "" : "s"}
            </span>
          </Row>
          <Row label="Last email send">{formatIn(schedule.lastEmailDispatchAt, schedule.timezone)}</Row>
          <Row label="Last payroll reminder">{formatIn(schedule.lastPayrollReminderAt, schedule.timezone)}</Row>
        </dl>
        {dirty && <p className="text-xs text-zinc-500">Save to see the updated times.</p>}
      </section>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-200">{children}</dd>
    </div>
  )
}
