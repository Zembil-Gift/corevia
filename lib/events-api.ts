export type EventTypeApi = "ONLINE" | "IN_PERSON"
export type EventStatusApi = "DRAFT" | "PUBLISHED"

export interface EventApi {
  id: number
  title: string
  slug: string
  description: string
  eventType: EventTypeApi
  location: string
  startDate: string
  endDate: string
  registrationUrl: string
  coverImageUrl?: string
  status: EventStatusApi
}
