export type EmailTemplate = {
  type: string
  audience: string
  subject: string | null
  heading: string | null
  message: string | null
  customized: boolean
  defaultSubject: string
  defaultHeading: string
  defaultMessage: string
  placeholders: string[]
}

export type EmailTemplates = {
  emailLogoUrl: string | null
  effectiveLogoUrl: string
  templates: EmailTemplate[]
}

export type EmailTemplateDraft = { subject: string; heading: string; message: string }

export type EmailPreview = { subject: string; html: string; text: string }

async function request<T>(path: string, init: RequestInit | undefined, fallback: string): Promise<T> {
  const res = await fetch(`/api/admin/email-templates${path}`, { cache: "no-store", ...init })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? fallback)
  return data as T
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

export const fetchEmailTemplates = () => request<EmailTemplates>("", undefined, "Failed to load email templates")

export const saveEmailTemplate = (type: string, draft: EmailTemplateDraft) =>
  request<EmailTemplate>(`/${type}`, json("PUT", draft), "Failed to save template")

export const resetEmailTemplate = (type: string) =>
  request<EmailTemplate>(`/${type}`, { method: "DELETE" }, "Failed to reset template")

export const previewEmailTemplate = (type: string, draft: EmailTemplateDraft) =>
  request<EmailPreview>(`/${type}/preview`, json("POST", draft), "Failed to render preview")

export const sendTestEmail = (type: string, draft: EmailTemplateDraft) =>
  request<{ sentTo: string }>(`/${type}/test`, json("POST", draft), "Failed to send test email")

export const removeEmailLogo = () =>
  request<EmailTemplates>("/logo", { method: "DELETE" }, "Failed to remove logo")

export async function uploadEmailLogo(file: File): Promise<EmailTemplates> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch("/api/admin/org/email-logo", { method: "POST", body: fd })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to upload logo")
  return data as EmailTemplates
}

export type EmailSchedule = {
  dispatchTime: string
  timezone: string
  payrollReminderIntervalDays: number
  dispatchTimeUtc: string
  nextDispatchAt: string
  nextPayrollReminderAt: string
  lastEmailDispatchAt: string | null
  lastPayrollReminderAt: string | null
}

export type EmailScheduleInput = Pick<EmailSchedule, "dispatchTime" | "timezone" | "payrollReminderIntervalDays">

async function scheduleRequest(init: RequestInit | undefined, fallback: string): Promise<EmailSchedule> {
  const res = await fetch("/api/admin/email-schedule", { cache: "no-store", ...init })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? fallback)
  return data as EmailSchedule
}

export const fetchEmailSchedule = () => scheduleRequest(undefined, "Failed to load email schedule")

export const saveEmailSchedule = (input: EmailScheduleInput) =>
  scheduleRequest(json("PUT", input), "Failed to save email schedule")
