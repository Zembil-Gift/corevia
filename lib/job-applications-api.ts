export type ApplicationStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "SELECTED_FOR_INTERVIEW"
  | "REJECTED"
  | "HIRED"

export interface JobApplicationApi {
  id: number
  jobId: number
  fullName: string
  email: string
  phoneNumber: string | null
  githubUrl: string | null
  resumeUrl: string | null
  status: ApplicationStatus
  hiredEmployeeId: number | null
  createdAt: string
  updatedAt: string
}

export type AiOverviewStatus = "PENDING" | "COMPLETED" | "FAILED"

export interface JobApplicationAiOverviewApi {
  applicationId: number
  fullName: string
  jobTitle: string
  aiOverviewText: string | null
  aiOverviewStatus: AiOverviewStatus
  aiOverviewError: string | null
  aiOverviewAttemptCount: number
  aiOverviewCompletedAt: string | null
}

export type EmailNotificationStatus = "PENDING" | "SENT" | "FAILED"

export type EmailNotificationType =
  | "EMPLOYEE_PASSWORD"
  | "ADMIN_PAYROLL_REMINDER"
  | "EMPLOYEE_PAYMENT_RECEIVED"
  | "HIRING_SELECTED_FOR_INTERVIEW"
  | "HIRING_REJECTED_PRE_INTERVIEW"
  | "HIRING_HIRED"
  | "HIRING_REJECTED_POST_INTERVIEW"

export interface EmailNotificationApi {
  id: number
  type: EmailNotificationType
  status: EmailNotificationStatus
  recipientEmail: string
  subject: string
  attemptCount: number
  lastError: string | null
  sentAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PageMetaApi {
  size: number
  number: number
  totalElements: number
  totalPages: number
}

export interface FailedEmailNotificationsResponse {
  content: EmailNotificationApi[]
  page: PageMetaApi
}
