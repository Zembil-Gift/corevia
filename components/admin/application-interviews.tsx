"use client"

import { useState } from "react"
import { CalendarClock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { confirmDialog } from "@/components/ui/app-dialog"
import { InterviewDialog } from "@/components/admin/interview-dialog"
import { cancelInterview, setInterviewOutcome, type Interview } from "@/lib/interviews-api"

const STATUS_LABEL: Record<Interview["status"], string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
}

const formatWhen = (i: Interview) =>
  `${new Date(i.startAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} – ${new Date(i.endAt).toLocaleTimeString(undefined, { timeStyle: "short" })}`

type Props = {
  application: { id: number; fullName: string; status: string }
  /** This application's interviews, newest first. */
  interviews: Interview[]
  onChange: (interview: Interview) => void
}

/** Interview summary + actions for one applicant row. */
export function ApplicationInterviews({ application, interviews, onChange }: Props) {
  const [dialog, setDialog] = useState<{ interview: Interview | null } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const closed = application.status === "HIRED" || application.status === "REJECTED"

  const run = async (id: number, work: () => Promise<Interview>) => {
    setBusyId(id)
    setError(null)
    try {
      onChange(await work())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusyId(null)
    }
  }

  const handleCancel = async (i: Interview) => {
    const ok = await confirmDialog({
      title: "Cancel interview?",
      message: `${application.fullName} and every interviewer will be told the interview is cancelled.`,
      confirmText: "Cancel interview",
      cancelText: "Keep it",
      destructive: true,
    })
    if (ok) run(i.id, () => cancelInterview(i.id))
  }

  return (
    <div className="space-y-2">
      {interviews.map((i) => {
        const past = new Date(i.endAt).getTime() < Date.now()
        return (
          <div key={i.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-2 text-xs">
            <p className="flex items-center gap-1.5 font-medium text-zinc-200">
              <CalendarClock className="size-3.5 shrink-0" aria-hidden />
              {formatWhen(i)}
            </p>
            <p className="mt-0.5 text-zinc-500">
              {STATUS_LABEL[i.status]} · {i.mode === "ONLINE" ? "Online" : "In person"}
              {i.participants.length > 0 && ` · ${i.participants.length} interviewer${i.participants.length === 1 ? "" : "s"}`}
              {i.googleCalendarEvent && " · Google Calendar"}
            </p>
            {i.meetingUrl && i.status === "SCHEDULED" && (
              <a href={i.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-[#e78a53] hover:underline">
                Meeting link
              </a>
            )}
            {i.status === "SCHEDULED" && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {busyId === i.id ? (
                  <Loader2 className="size-4 animate-spin text-zinc-500" aria-label="Saving" />
                ) : past ? (
                  <>
                    <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => run(i.id, () => setInterviewOutcome(i.id, "COMPLETED"))}>
                      Mark done
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => run(i.id, () => setInterviewOutcome(i.id, "NO_SHOW"))}>
                      No-show
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setDialog({ interview: i })}>
                      Reschedule
                    </Button>
                    <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-400" onClick={() => handleCancel(i)}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}

      {!closed && (
        <Button type="button" size="sm" variant="outline" onClick={() => setDialog({ interview: null })}>
          <CalendarClock className="size-4" /> {interviews.length ? "Schedule another" : "Schedule interview"}
        </Button>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}

      <InterviewDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        applicationId={application.id}
        candidateName={application.fullName}
        interview={dialog?.interview}
        onSaved={onChange}
      />
    </div>
  )
}
