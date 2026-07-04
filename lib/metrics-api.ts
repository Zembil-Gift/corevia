export type MetricScoreValue = number | null

export interface EmployeeMetricSummaryResponse {
  employeeId: number
  employeeName: string
  role: string
  department: string
  employmentType: string
  employeeStatus: string
  periodStart: string
  periodEnd: string
  leadershipScore: MetricScoreValue
  attendanceScore: MetricScoreValue
  taskScore: MetricScoreValue
  supportScore: MetricScoreValue
  overallScore: MetricScoreValue
  strengthSummary: string | null
  improvementSummary: string | null
}

export interface EmployeeMetricSummaryPage {
  content: EmployeeMetricSummaryResponse[]
  totalElements?: number
  totalPages?: number
  size?: number
  number?: number
}

export interface LeadershipPrincipleResponse {
  id: number
  name: string
  description: string
  isActive: boolean
}

export interface PeerReviewPeriodResponse {
  id: number
  name?: string | null
  periodStart: string
  periodEnd: string
  createdAt: string
}

export interface PeerReviewPeriodStatusResponse {
  id: number
  name?: string | null
  periodStart: string
  periodEnd: string
  submitted: boolean
}

export interface PeerReviewAvailableEmployeeResponse {
  id: number
  name: string
  department: string
  role: string
  employmentType: string
}

export interface PeerReviewPrincipleAverage {
  principleId: number
  principleName: string
  averageRating: number | null
  ratingCount: number | null
}

export interface PeerReviewSelfResultsResponse {
  periodId: number
  periodName?: string | null
  periodStart: string
  periodEnd: string
  leadershipScore?: number | null
  principleAverages?: PeerReviewPrincipleAverage[]
}

export interface PeerReviewPeriodEmployeeResult {
  employeeId: number
  employeeName: string
  department: string
  role: string
  employmentType: string
  leadershipScore?: number | null
  principleAverages?: PeerReviewPrincipleAverage[]
}

export interface PeerReviewPeriodResultsResponse {
  periodId: number
  periodName?: string | null
  periodStart: string
  periodEnd: string
  employees: PeerReviewPeriodEmployeeResult[]
}

export type PeerReviewRatingValue = "EXCEEDS_THE_BAR" | "MEETS_THE_BAR" | "NEEDS_IMPROVEMENT"

export interface PeerReviewRatingInput {
  principleId: number
  rating: PeerReviewRatingValue
  comment?: string | null
}

export interface PeerReviewSubmitRequest {
  revieweeId: number
  periodStart: string
  periodEnd: string
  ratings: PeerReviewRatingInput[]
}

export interface PeerReviewResponse {
  id: number
  revieweeId: number
  revieweeName: string
  periodStart: string
  periodEnd: string
  principleId: number
  principleName: string
  rating: PeerReviewRatingValue
  comment?: string | null
  createdAt: string
}

export interface AdminPeerReviewResponse {
  id: number
  periodId: number
  periodName?: string | null
  periodStart: string
  periodEnd: string
  reviewerId: number
  reviewerName: string
  revieweeId: number
  revieweeName: string
  rating: PeerReviewRatingValue | null
  feedback: string | null
  createdAt: string
  updatedAt: string
}

export interface PeerReviewSummaryEmployeeResponse {
  employeeId: number
  employeeName: string
  department: string
  role: string
  employmentType: string
  periodStart: string
  periodEnd: string
  totalPoints: number
  ratingCount: number
  maxPoints: number
  leadershipScore: number | null
}

export type TimeSpentPeriodType = "DAILY" | "WEEKLY" | "MONTHLY"

export interface EmployeeTimeSpentResponse {
  employeeId: number
  employeeName: string
  periodType: TimeSpentPeriodType
  periodStart: string
  periodEnd: string
  officeDaysCount: number
  workedMinutes: number
  requiredMinutes: number
  remainingMinutes: number
  completionPercent: number
}
