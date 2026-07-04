export interface GithubRecentActivity {
  id: number
  employeeId: number
  employeeName: string
  githubUsername: string
  activityType: string
  repository: string
  activityId: string
  title: string
  description: string
  url: string
  activityTimestamp: string
  createdAt: string
  updatedAt: string
}

export interface GithubEmployeeReportResponse {
  employeeId: number
  employeeName: string
  githubUsername: string
  totalCommits: number
  prsOpened: number
  prsMerged: number
  prsClosed: number
  prReviews: number
  issuesOpened: number
  issuesClosed: number
  recentActivities: GithubRecentActivity[]
}

export interface EmployeeWithGithubApi {
  id: number
  name: string
  email: string
  phone: string
  position: string
  role: string
  department: string
  employmentType: string
  employeeStatus: string
  linkedinUrl?: string | null
  photo?: string | null
  githubUsername: string
  active: boolean
  salaryDate?: string | null
  salaryAmountMinor?: number | null
  salaryScheduleDays?: string[]
  createdAt: string
  updatedAt: string
}

export interface PageResponseApi<T> {
  content: T[]
  totalElements?: number
  totalPages?: number
  pageable?: {
    pageNumber: number
    pageSize: number
  }
  numberOfElements?: number
  first?: boolean
  last?: boolean
  empty?: boolean
}
