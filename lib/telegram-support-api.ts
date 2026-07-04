export interface TelegramSupportTotals {
  pending: number
  inProgress: number
  resolved: number
  total: number
}

export interface TelegramSupportAverages {
  msFromFirstStatusChangeToResolved: number
  msFromCreatedAtToResolved: number
}

export interface TelegramSupportIssueTypeCount {
  issueType: string
  count: number
}

export interface TelegramSupportTicket {
  id: number
  ticketCode: string
  customerTelegramChatId: string
  customerId: number
  customerEmail: string
  customerName: string
  customerTelegramUsername: string | null
  orderId: string | null
  issueType: string
  description: string
  status: string
  modifiedBy: string[]
  createdAt: string
  updatedAt: string
}

export interface TelegramSupportReportResponse {
  employeeId: number
  employeeName: string
  telegramUsername: string
  totals: TelegramSupportTotals
  averages: TelegramSupportAverages
  countsByIssueType: TelegramSupportIssueTypeCount[]
  recentTickets: TelegramSupportTicket[]
}
