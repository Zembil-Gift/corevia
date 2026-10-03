export type InterviewMode = "ONLINE" | "IN_PERSON"
export type MeetingProvider = "GOOGLE_MEET" | "ZOOM"
export type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"

export type InterviewParticipant = {
  kind: "MANAGER" | "EMPLOYEE" | "EXTERNAL"
  managerId: number | null
  employeeId: number | null
  name: string | null
  email: string
}

export type Interview = {
  id: number
  applicationId: number
  candidateName: string
  candidateEmail: string
  jobTitle: string
  startAt: string
  endAt: string
  mode: InterviewMode
  location: string | null
  meetingUrl: string | null
  notes: string | null
  status: InterviewStatus
  /** True when the invites went out through the organizer's Google Calendar. */
  googleCalendarEvent: boolean
  participants: InterviewParticipant[]
  /** One entry per interviewer; recommendation/comments/submittedAt stay null until they submit. */
  feedback: InterviewFeedback[]
  createdAt: string
}

export type Recommendation = "STRONG_HIRE" | "HIRE" | "NO_HIRE" | "STRONG_NO_HIRE"

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  STRONG_HIRE: "Strong hire",
  HIRE: "Hire",
  NO_HIRE: "No hire",
  STRONG_NO_HIRE: "Strong no hire",
}

export type InterviewFeedback = {
  interviewerName: string | null
  interviewerEmail: string
  recommendation: Recommendation | null
  comments: string | null
  submittedAt: string | null
}

export type InterviewInput = {
  startAt: string
  endAt: string
  mode: InterviewMode
  location: string
  meetingUrl: string
  /** Creates the link in the manager's connected account when meetingUrl is empty. */
  meetingProvider: MeetingProvider | null
  notes: string
  managerIds: number[]
  employeeIds: number[]
  externalInvitees: { name: string; email: string }[]
}

export type ParticipantOption = { id: number; name: string; email: string; detail: string | null }
export type ParticipantOptions = { managers: ParticipantOption[]; employees: ParticipantOption[] }

const BASE = "/api/manager/interviews"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store", ...init })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Interview request failed")
  return data as T
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

export const fetchJobInterviews = (jobId: number | string) => request<Interview[]>(`/job/${jobId}`)

export const fetchParticipantOptions = () => request<ParticipantOptions>("/participant-options")

export const scheduleInterview = (applicationId: number, input: InterviewInput) =>
  request<Interview>(`/application/${applicationId}`, json("POST", input))

export const rescheduleInterview = (id: number, input: InterviewInput) => request<Interview>(`/${id}`, json("PUT", input))

export const cancelInterview = (id: number) => request<Interview>(`/${id}/cancel`, { method: "POST" })

export const setInterviewOutcome = (id: number, status: "COMPLETED" | "NO_SHOW") =>
  request<Interview>(`/${id}/status`, json("POST", { status }))
