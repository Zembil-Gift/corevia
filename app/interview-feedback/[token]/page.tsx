"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { parseAiOverview } from "@/lib/ai-overview"
import { RECOMMENDATION_LABEL, type Recommendation } from "@/lib/interviews-api"

type Answer = { fieldId: string; label: string; type: "TEXT" | "LINK" | "FILE"; value: string; fileName: string | null }

type FeedbackForm = {
  organizationName: string
  organizationLogoUrl: string | null
  interviewerName: string | null
  expiresAt: string
  candidate: {
    fullName: string
    email: string
    phoneNumber: string | null
    githubUrl: string | null
    resumeUrl: string | null
    answers: Answer[]
    aiOverview: string | null
  }
  interview: {
    jobTitle: string
    startAt: string
    endAt: string
    timezone: string
    mode: "ONLINE" | "IN_PERSON"
    location: string | null
    meetingUrl: string | null
    notes: string | null
    status: string
    panel: string[]
  }
}

const RECOMMENDATIONS = Object.keys(RECOMMENDATION_LABEL) as Recommendation[]
const LINK = "inline-flex items-center gap-1 break-all text-[#e78a53] hover:underline"

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className={LINK}>
      {children} <ExternalLink className="size-3 shrink-0" aria-hidden />
    </a>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-200">{children}</dd>
    </div>
  )
}

/** No-login page an interviewer opens from their email: candidate + interview details and the feedback form. */
export default function InterviewFeedbackPage() {
  const { token } = useParams<{ token: string }>()
  const [form, setForm] = useState<FeedbackForm | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [comments, setComments] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch(`/api/interview-feedback/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data as { error?: string }).error ?? "This feedback link could not be opened")
        setForm(data as FeedbackForm)
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "This feedback link could not be opened"))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recommendation || !comments.trim()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/api/interview-feedback/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation, comments }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Your feedback could not be submitted")
      }
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Your feedback could not be submitted")
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError || submitted) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-zinc-950 px-4 text-center">
        <div className="max-w-md">
          {submitted && <CheckCircle2 className="mx-auto mb-4 size-10 text-emerald-400" aria-hidden />}
          <h1 className="text-xl font-semibold text-white">{submitted ? "Thank you for your feedback" : "Link unavailable"}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {submitted ? "It has been shared with the hiring team. This link no longer works." : loadError}
          </p>
        </div>
      </main>
    )
  }

  if (!form) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <Loader2 className="size-6 animate-spin text-zinc-500" aria-label="Loading" />
      </main>
    )
  }

  const { candidate, interview } = form
  const tz = interview.timezone
  const when = `${new Date(interview.startAt).toLocaleString(undefined, { timeZone: tz, dateStyle: "full", timeStyle: "short" })} – ${new Date(
    interview.endAt,
  ).toLocaleTimeString(undefined, { timeZone: tz, timeStyle: "short" })} (${tz})`
  const notStarted = new Date(interview.startAt).getTime() > Date.now()
  const ai = parseAiOverview(candidate.aiOverview)

  return (
    <main className="min-h-dvh bg-zinc-950 px-4 py-10 text-zinc-200">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center gap-3">
          {form.organizationLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.organizationLogoUrl}
              alt=""
              className="size-10 rounded-md object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <div>
            <p className="text-sm text-zinc-400">{form.organizationName}</p>
            <h1 className="text-2xl font-semibold text-white">
              Interview feedback: {candidate.fullName}
            </h1>
            <p className="text-sm text-zinc-400">
              {interview.jobTitle}
              {form.interviewerName && ` · for ${form.interviewerName}`}
            </p>
          </div>
        </header>

        <Section title="Interview">
          <dl className="space-y-3">
            <Row label="When">{when}</Row>
            <Row label="Format">{interview.mode === "ONLINE" ? "Online" : "In person"}</Row>
            {interview.location && <Row label="Location">{interview.location}</Row>}
            {interview.meetingUrl && (
              <Row label="Meeting link">
                <ExtLink href={interview.meetingUrl}>{interview.meetingUrl}</ExtLink>
              </Row>
            )}
            {interview.panel.length > 0 && <Row label="Panel">{interview.panel.join(", ")}</Row>}
            {interview.notes && (
              <Row label="Notes">
                <p className="whitespace-pre-wrap">{interview.notes}</p>
              </Row>
            )}
          </dl>
        </Section>

        <Section title="Candidate">
          <dl className="space-y-3">
            <Row label="Name">{candidate.fullName}</Row>
            <Row label="Email">{candidate.email}</Row>
            {candidate.phoneNumber && <Row label="Phone">{candidate.phoneNumber}</Row>}
            {candidate.githubUrl && (
              <Row label="GitHub">
                <ExtLink href={candidate.githubUrl}>{candidate.githubUrl}</ExtLink>
              </Row>
            )}
            {candidate.resumeUrl && (
              <Row label="CV">
                <ExtLink href={candidate.resumeUrl}>Open CV</ExtLink>
              </Row>
            )}
            {candidate.answers.map((a) => (
              <Row key={a.fieldId} label={a.label}>
                {a.type === "TEXT" ? (
                  <p className="whitespace-pre-wrap break-words">{a.value}</p>
                ) : (
                  <ExtLink href={a.value}>{a.type === "FILE" ? a.fileName || "Download file" : a.value}</ExtLink>
                )}
              </Row>
            ))}
          </dl>

          {ai && (
            <div className="mt-5 border-t border-zinc-800 pt-4 text-sm">
              <p className="font-medium text-white">
                AI screening{ai.matchScore !== null && ` · match ${Math.round(ai.matchScore)}/100`}
              </p>
              {ai.overallAssessment && <p className="mt-2 text-zinc-300">{ai.overallAssessment}</p>}
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["Strengths", ai.strengths],
                    ["Weaknesses", ai.weaknesses],
                  ] as const
                ).map(([title, items]) =>
                  items.length ? (
                    <div key={title}>
                      <p className="text-zinc-400">{title}</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-zinc-300">
                        {items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}
        </Section>

        <Section title="Your feedback">
          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset disabled={notStarted || submitting}>
              <legend className="mb-2 text-sm text-zinc-300">Recommendation</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RECOMMENDATIONS.map((r) => (
                  <label
                    key={r}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#e78a53]/60 ${
                      recommendation === r
                        ? "border-[#e78a53] bg-[#e78a53]/10 text-white"
                        : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="recommendation"
                      value={r}
                      checked={recommendation === r}
                      onChange={() => setRecommendation(r)}
                      required
                      className="sr-only"
                    />
                    {RECOMMENDATION_LABEL[r]}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="feedback-comments" className="mb-2 block text-sm text-zinc-300">
                Comments
              </label>
              <textarea
                id="feedback-comments"
                required
                maxLength={10000}
                rows={8}
                disabled={notStarted || submitting}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Strengths, concerns, and anything the hiring team should know"
                className="min-h-[160px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-[#e78a53] focus:outline-none focus:ring-1 focus:ring-[#e78a53]/20 disabled:opacity-60"
              />
            </div>

            {submitError && (
              <p role="alert" className="text-sm text-red-400">
                {submitError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={notStarted || submitting || !recommendation || !comments.trim()}>
                {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Submit feedback
              </Button>
              <p className="text-xs text-zinc-500">
                {notStarted
                  ? "You can submit feedback once the interview starts."
                  : `You can submit once; the link stops working afterwards. It expires ${new Date(form.expiresAt).toLocaleDateString(undefined, { dateStyle: "medium" })}.`}
              </p>
            </div>
          </form>
        </Section>
      </div>
    </main>
  )
}
