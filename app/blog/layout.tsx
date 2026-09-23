import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog | Mahberix",
  description:
    "Insights on Pan-African tech, product building, and connecting markets.",
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
