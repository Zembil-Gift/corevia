import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | AfroDebab LLC",
  description:
    "Learn about AfroDebab — a Pan-African technology holding company empowering African innovation and connecting local markets with the diaspora.",
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
