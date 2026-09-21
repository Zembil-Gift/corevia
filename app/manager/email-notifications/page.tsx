"use client"

import { useState } from "react"
import { EmailBuilder } from "@/components/admin/email-builder"
import { EmailSchedule } from "@/components/admin/email-schedule"
import { FailedEmailNotifications } from "@/components/admin/failed-email-notifications"

const TABS = [
  { id: "builder", label: "Email builder" },
  { id: "schedule", label: "Schedule" },
  { id: "failed", label: "Failed deliveries" },
] as const

export default function AdminEmailNotificationsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("builder")

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Email Notifications</h1>
        <p className="mt-1 text-zinc-400">Customize the emails your team and candidates receive, choose when they are sent, and retry failed deliveries.</p>
      </div>

      <div role="tablist" className="mb-6 flex gap-1 border-b border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id ? "border-primary text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "builder" && <EmailBuilder />}
      {tab === "schedule" && <EmailSchedule />}
      {tab === "failed" && <FailedEmailNotifications />}
    </div>
  )
}
