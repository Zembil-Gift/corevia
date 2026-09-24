export type JobEmploymentTypeApi =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERN"

export type JobStatusApi = "DRAFT" | "OPEN" | "CLOSED"

export type ApplicationFieldType = "LINK" | "FILE" | "TEXT"
export type ApplicationFileType = "PDF" | "DOC" | "DOCX" | "ODT" | "RTF" | "TXT" | "MD"

/** A manager-defined question on a job's application form. */
export interface ApplicationField {
  id: string
  type: ApplicationFieldType
  label: string
  helpText?: string | null
  required: boolean
  fileTypes?: ApplicationFileType[] | null
  maxLength?: number | null
}

export interface JobApi {
  id: number
  title: string
  slug: string
  department: string
  employmentType: JobEmploymentTypeApi
  location: string
  description: string
  status: JobStatusApi
  createdAt?: string
  experienceLevel?: string | null
  salaryRange?: string | null
  /** yyyy-mm-dd, last day applications are accepted */
  applicationDeadline?: string | null
  acceptingApplications?: boolean
  applicationFields?: ApplicationField[]
}

export const EXPERIENCE_LEVELS = ["Entry level", "Junior", "Mid level", "Senior", "Lead", "Manager", "Executive"]

/** Readable document formats applicants may upload (mirrors the backend's FileType). */
export const APPLICATION_FILE_TYPES: Record<ApplicationFileType, { label: string; extensions: string[] }> = {
  PDF: { label: "PDF", extensions: ["pdf"] },
  DOC: { label: "Word (.doc)", extensions: ["doc"] },
  DOCX: { label: "Word (.docx)", extensions: ["docx"] },
  ODT: { label: "OpenDocument (.odt)", extensions: ["odt"] },
  RTF: { label: "Rich text (.rtf)", extensions: ["rtf"] },
  TXT: { label: "Plain text (.txt)", extensions: ["txt"] },
  MD: { label: "Markdown (.md)", extensions: ["md", "markdown"] },
}

export const MAX_APPLICATION_FILE_BYTES = 10 * 1024 * 1024
export const MAX_APPLICATION_FIELDS = 15
export const DEFAULT_TEXT_ANSWER_LENGTH = 2000
export const MAX_TEXT_ANSWER_LENGTH = 5000

export function acceptFor(types: ApplicationFileType[]): string {
  return types.flatMap((t) => APPLICATION_FILE_TYPES[t].extensions.map((e) => `.${e}`)).join(",")
}

export function fileMatchesTypes(file: File, types: ApplicationFileType[]): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  return types.some((t) => APPLICATION_FILE_TYPES[t].extensions.includes(ext))
}

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".")
  } catch {
    return false
  }
}

/** Ethio telecom (9…) / Safaricom (7…) mobiles: 09…, 9…, 2519… or +2519…, spaces/dashes allowed. */
export function isEthiopianPhone(value: string): boolean {
  return /^(?:\+?251|0)?[79]\d{8}$/.test(value.replace(/[\s().-]/g, ""))
}

/** Format API employment type for display. */
export function formatJobEmploymentType(
  type: JobEmploymentTypeApi | string
): string {
  const labels: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    CONTRACT: "Contract",
    INTERN: "Intern",
  }
  return labels[type] ?? type
}

/** Employment type options for filter chips (API enum values). */
export const JOB_EMPLOYMENT_TYPES: JobEmploymentTypeApi[] = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
]

export function isJobOpen(job: JobApi): boolean {
  return job.acceptingApplications ?? job.status === "OPEN"
}
