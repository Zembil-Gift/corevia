const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL!

export const DAY_OF_WEEK_VALUES = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const

export type DayOfWeekApi = (typeof DAY_OF_WEEK_VALUES)[number]
export type PaymentStatusApi = "PENDING" | "PAID"

export interface EmployeeApi {
  id: number
  name: string
  email: string
  phone: string
  position: string
  linkedinUrl?: string | null
  photo?: string | null
  active: boolean
  salaryDate?: string | null
  salaryAmountMinor?: number | null
  salaryScheduleDays?: DayOfWeekApi[]
  subOrganizationId?: number | null
  subOrganizationName?: string | null
  createdAt: string
  updatedAt: string
}

export interface EmployeeListResponse {
  content: EmployeeApi[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type EmployeeSortBy = "createdAt" | "name" | "email" | "position" | string
export type EmployeeSortDirection = "asc" | "desc"

export interface EmployeeAttendanceApi {
  id: number
  employeeId: number
  date: string
  clockInAt: string
  clockOutAt: string | null
  lunchBreakInAt: string | null
  lunchBreakOutAt: string | null
  createdAt: string
  updatedAt: string
}

// Manager-facing payroll row. amountMinor is the net (disbursed) amount; the breakdown
// exposes the government income tax and the employer-paid 11% pension the company remits.
export interface EmployeePaymentApi {
  id: number
  employeeId: number
  employeeName: string
  subOrganizationId?: number | null
  subOrganizationName?: string | null
  cycleStartDate: string
  dueDate: string
  amountMinor: number
  grossAmountMinor: number
  incomeTaxMinor: number
  employeePensionMinor: number
  employerPensionMinor: number
  retirementSavingMinor: number
  paidAmountMinor: number | null
  status: PaymentStatusApi
  transactionReference: string | null
  paidAt: string | null
  lastReminderSentAt: string | null
  createdAt: string
  updatedAt: string
}

// Employee-facing payroll row. taxMinor is the variable income tax + the 7% pension;
// retirementSavingMinor is the total retirement saving (7% + 11%).
export interface EmployeePaymentSelfApi {
  id: number
  cycleStartDate: string
  dueDate: string
  grossAmountMinor: number
  netAmountMinor: number
  taxMinor: number
  retirementSavingMinor: number
  paidAmountMinor: number | null
  status: PaymentStatusApi
  transactionReference: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export async function fetchEmployees(
  page: number = 0,
  size: number = 10,
  sortBy?: EmployeeSortBy,
  direction?: EmployeeSortDirection
): Promise<EmployeeListResponse> {
  const params = new URLSearchParams()
  params.set("page", String(page))
  params.set("size", String(size))
  if (sortBy) params.set("sortBy", sortBy)
  if (direction) params.set("direction", direction)

  const res = await fetch(`${CMS_BASE_URL}/manager/employees?${params.toString()}`, {
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch employees: ${res.status}`)
  }
  return res.json()
}
