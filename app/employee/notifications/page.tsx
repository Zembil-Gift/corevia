import { NotificationList } from "@/components/notifications/notification-list"
import { CompanyCalendarCard } from "@/components/employee/company-calendar-card"

export default function EmployeeNotificationsPage() {
  return (
    <>
      <CompanyCalendarCard />
      <NotificationList audience="employee" />
    </>
  )
}
