import { NotificationList } from "@/components/notifications/notification-list"

export default function ManagerNotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl pb-24">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-100">Notifications</h1>
      <NotificationList audience="manager" />
    </div>
  )
}
