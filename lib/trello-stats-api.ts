export interface TrelloRecentActivity {
  id: number
  employeeId: number
  employeeName: string
  trelloUsername: string
  activityType: string
  boardName: string
  cardId: string
  cardName: string
  listName: string
  activityId: string
  description: string
  url: string
  activityTimestamp: string
  createdAt: string
  updatedAt: string
}

export interface TrelloEmployeeReportResponse {
  employeeId: number
  employeeName: string
  trelloUsername: string
  cardsCreated: number
  cardsMoved: number
  cardsArchived: number
  commentsAdded: number
  checkItemsCompleted: number
  attachmentsAdded: number
  recentActivities: TrelloRecentActivity[]
}

export interface EmployeeWithTrelloApi {
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
  trelloUsername: string
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
