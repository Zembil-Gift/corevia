"use client"

import { useEffect, useState } from "react"
import { Building2 } from "lucide-react"
import type { SubOrganization } from "@/lib/sub-orgs-api"

/** The org's sub-organizations, loaded once for the per-board/org tick lists (managers only). */
export function useBranches(enabled: boolean): SubOrganization[] {
  const [branches, setBranches] = useState<SubOrganization[]>([])
  useEffect(() => {
    if (!enabled) return
    fetch("/api/admin/sub-organizations", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => Array.isArray(data) && setBranches(data))
      .catch(() => {})
  }, [enabled])
  return branches
}

/** Vice managers: everything they track is credited to their own branch. */
export function LockedBranchNote({ name }: { name?: string | null }) {
  return (
    <p className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
      <Building2 className="size-4 text-[#e78a53]" />
      Activity is credited to employees of <span className="font-medium">{name ?? "your branch"}</span>.
    </p>
  )
}

interface BranchTicksProps {
  /** Accessible name of the tracked board/org these ticks belong to. */
  label: string
  branches: SubOrganization[]
  value: number[]
  onChange: (value: number[]) => void
}

/** Which sub-organizations one tracked board/org credits; none ticked = all of them. */
export function BranchTicks({ label, branches, value, onChange }: BranchTicksProps) {
  if (branches.length === 0) return null
  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  return (
    <fieldset className="mt-2 pl-7">
      <legend className="sr-only">Sub-organizations credited by {label}</legend>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {branches.map((b) => (
          <label key={b.id} className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={value.includes(b.id)}
              onChange={() => toggle(b.id)}
              className="size-3.5 accent-[#e78a53]"
            />
            {b.name}
            {b.isDefault ? " (Main)" : ""}
          </label>
        ))}
        <span className="text-xs text-zinc-500">{value.length === 0 ? "· All sub-organizations" : ""}</span>
      </div>
    </fieldset>
  )
}
