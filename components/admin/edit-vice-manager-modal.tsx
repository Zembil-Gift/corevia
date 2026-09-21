"use client"

import { useEffect, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { ShieldCheck, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SubOrganization, ViceManager } from "@/lib/sub-orgs-api"

interface EditViceManagerModalProps {
  viceManager: ViceManager | null
  subOrganizations: SubOrganization[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditViceManagerModal({
  viceManager,
  subOrganizations,
  open,
  onOpenChange,
  onSuccess,
}: EditViceManagerModalProps) {
  const [fullName, setFullName] = useState("")
  const [subOrganizationId, setSubOrganizationId] = useState<number | "">("")
  const [active, setActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (viceManager) {
      setFullName(viceManager.fullName || "")
      setSubOrganizationId(viceManager.subOrganizationId ?? "")
      setActive(viceManager.active)
      setError("")
    }
  }, [viceManager])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!viceManager) return
    setError("")

    if (!fullName.trim()) {
      setError("Full name is required")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        fullName: fullName.trim(),
        subOrganizationId: subOrganizationId ? Number(subOrganizationId) : undefined,
        active,
      }

      const res = await fetch(`/api/admin/vice-managers/${viceManager.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update vice manager")
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vice manager")
    } finally {
      setSubmitting(false)
    }
  }

  if (!viceManager) return null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-full max-w-md translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-white">
              <ShieldCheck className="h-5 w-5 text-[#e78a53]" />
              <Dialog.Title>Edit Vice Manager</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <Label className="text-xs text-zinc-400">Email Address (Read-only)</Label>
              <Input
                disabled
                value={viceManager.email}
                className="mt-1 bg-zinc-900/50 border-zinc-800 text-zinc-400"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400">
                Full Name <span className="text-[#e78a53]">*</span>
              </Label>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400">Assigned Sub-Organization</Label>
              <select
                value={subOrganizationId}
                onChange={(e) => setSubOrganizationId(e.target.value ? Number(e.target.value) : "")}
                className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#e78a53]"
              >
                <option value="">Select a sub-organization...</option>
                {subOrganizations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isDefault ? "(Default Main)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="activeToggle"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#e78a53] focus:ring-[#e78a53]"
              />
              <Label htmlFor="activeToggle" className="text-sm font-normal text-zinc-200 cursor-pointer">
                Account Active (allowed to login)
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#e78a53] hover:bg-[#e78a53]/90 text-white font-medium px-5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
