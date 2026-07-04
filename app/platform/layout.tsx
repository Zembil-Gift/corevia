import type React from "react"
import { PlatformNav } from "@/components/platform/platform-nav"

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PlatformNav />
      <main className="ml-60 min-h-dvh">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
