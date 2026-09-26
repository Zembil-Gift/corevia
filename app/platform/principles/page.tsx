"use client"

import { useCallback, useEffect, useState } from "react"
import { PrinciplesManager } from "@/components/principles-manager"
import type { LeadershipPrincipleResponse } from "@/lib/metrics-api"

export default function PrinciplesPage() {
  const [principles, setPrinciples] = useState<LeadershipPrincipleResponse[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/platform/principles", { cache: "no-store" })
      const data = await res.json().catch(() => [])
      if (res.ok && Array.isArray(data)) setPrinciples(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Leadership principles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The default set organizations can copy into their own rating principles. Edits here don&apos;t
          change principles an organization already has.
        </p>
      </div>
      <PrinciplesManager
        api="/api/platform/principles"
        description="Organizations copy the active ones as their starting set"
        principles={principles}
        loading={loading}
        onChanged={load}
      />
    </div>
  )
}
