import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Events | Corevia",
  description:
    "Meetups, app launches, and tech events. Join us online or in person.",
}

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
