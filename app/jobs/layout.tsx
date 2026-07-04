import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Jobs | Corevia",
  description:
    "Join AfroDebab. We're building Pan-African technology products and a team that spans the diaspora and the continent.",
}

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
