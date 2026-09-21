"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { ShieldCheck, Loader2, X, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SubOrganization } from "@/lib/sub-orgs-api"

interface CreateViceManagerModalProps {
  subOrganizations: SubOrganization[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateViceManagerModal({
  subOrganizations,
  open,
  onOpenChange,
  onSuccess,
}: CreateViceManagerModalProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [subOrganizationId, setSubOrganizationId] = useState<number | "">("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [createdResult, setCreatedResult] = useState<{ email: string; temporaryPassword?: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!fullName.trim() || !email.trim() || !subOrganizationId) {
      setError("Please fill in all required fields and select a sub-organization.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/vice-managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          subOrganizationId: Number(subOrganizationId),
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create vice manager")
      }

      setCreatedResult({
        email: email.trim(),
        temporaryPassword: data.temporaryPassword,
      })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vice manager")
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // reset after close
    setTimeout(() => {
      setFullName("")
      setEmail("")
      setSubOrganizationId("")
      setError("")
      setCreatedResult(null)
      setCopied(false)
    }, 200)
  }

  const handleCopyPassword = () => {
    if (createdResult?.temporaryPassword) {
      navigator.clipboard.writeText(createdResult.temporaryPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(true); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-full max-w-md translate-x-[-50%] translate-y-[-50%] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-white">
              <ShieldCheck className="h-5 w-5 text-[#e78a53]" />
              <Dialog.Title>Add Vice Manager</Dialog.Title>
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

          {createdResult ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400">
                <div className="flex items-center gap-2 font-medium">
                  <Check className="h-5 w-5" />
                  Vice Manager Created Successfully!
                </div>
                <p className="mt-1 text-xs text-emerald-300/80">
                  An email with login instructions has been sent to {createdResult.email}.
                </p>
              </div>

              {createdResult.temporaryPassword && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-1">
                  <Label className="text-xs text-zinc-400">Generated Password</Label>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono text-zinc-100 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                      {createdResult.temporaryPassword}
                    </code>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCopyPassword}
                      className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleClose}
                  className="bg-[#e78a53] hover:bg-[#e78a53]/90 text-white"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <Label className="text-xs text-zinc-400">
                  Full Name <span className="text-[#e78a53]">*</span>
                </Label>
                <Input
                  required
                  placeholder="e.g. Almaz Tadesse"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-400">
                  Email Address <span className="text-[#e78a53]">*</span>
                </Label>
                <Input
                  required
                  type="email"
                  placeholder="e.g. almaz@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-100"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-400">
                  Assigned Sub-Organization <span className="text-[#e78a53]">*</span>
                </Label>
                <select
                  required
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
                <p className="mt-1 text-xs text-zinc-500">
                  This vice manager will oversee attendance, metrics, and reports for this branch.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
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
                      Creating...
                    </>
                  ) : (
                    "Create Vice Manager"
                  )}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
