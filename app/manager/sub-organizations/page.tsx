"use client"

import { useCallback, useEffect, useState } from "react"
import { Building2, Plus, Pencil, Trash2, Edit3, MapPin, Clock, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SubOrganization } from "@/lib/sub-orgs-api"
import { CreateSubOrgModal } from "@/components/admin/create-sub-org-modal"
import { EditSubOrgModal } from "@/components/admin/edit-sub-org-modal"
import { RenameSubOrgModal } from "@/components/admin/rename-sub-org-modal"
import { alertDialog, confirmDialog } from "@/components/ui/app-dialog"

export default function SubOrganizationsPage() {
  const [subOrgs, setSubOrgs] = useState<SubOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editSubOrg, setEditSubOrg] = useState<SubOrganization | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [renameSubOrg, setRenameSubOrg] = useState<SubOrganization | null>(null)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchSubOrgs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/sub-organizations")
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Failed to load: ${res.status}`)
      }
      const data = await res.json()
      setSubOrgs(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sub-organizations")
      setSubOrgs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubOrgs()
  }, [fetchSubOrgs])

  const handleDelete = async (subOrg: SubOrganization) => {
    if (subOrg.isDefault) {
      await alertDialog({ title: "Can't delete main sub-organization", message: "The default main sub-organization cannot be deleted. You can rename it instead." })
      return
    }
    if (!(await confirmDialog({ title: "Delete sub-organization", message: `Delete sub-organization "${subOrg.name}"?`, confirmText: "Delete", destructive: true }))) return

    setDeletingId(subOrg.id)
    try {
      const res = await fetch(`/api/admin/sub-organizations/${subOrg.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Failed to delete sub-organization")
      }
      fetchSubOrgs()
    } catch (err) {
      await alertDialog({ title: "Couldn't delete sub-organization", message: err instanceof Error ? err.message : "Failed to delete sub-organization", destructive: true })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#e78a53]" />
            <h1 className="text-2xl font-bold text-white">Sub-Organizations & Branches</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Manage branches, office GPS geofences, and working hour policies.
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-[#e78a53] hover:bg-[#e78a53]/90 text-white gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Sub-Organization
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#e78a53]" />
        </div>
      ) : subOrgs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-zinc-600" />
          <h3 className="mt-3 text-lg font-medium text-zinc-200">No sub-organizations found</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Create your first branch or location to divide employees and attendance zones.
          </p>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 bg-[#e78a53] hover:bg-[#e78a53]/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Sub-Organization
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subOrgs.map((subOrg) => (
            <div
              key={subOrg.id}
              className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur transition-all hover:border-zinc-700 shadow-lg"
            >
              {/* Card Title & Badges */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{subOrg.name}</h3>
                    {subOrg.isDefault && (
                      <span className="rounded-full bg-[#e78a53]/20 px-2 py-0.5 text-xs font-medium text-[#e78a53] border border-[#e78a53]/30">
                        Default Main
                      </span>
                    )}
                  </div>
                  {subOrg.location && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                      <span className="truncate">{subOrg.location}</span>
                    </div>
                  )}
                </div>
                <span className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                  <Users className="h-3 w-3 text-zinc-400" />
                  {subOrg.employeeCount} {subOrg.employeeCount === 1 ? "employee" : "employees"}
                </span>
              </div>

              {/* Coordinates & Geofence info */}
              <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#e78a53]" />
                    Coordinates:
                  </span>
                  <span className="font-mono text-zinc-200">
                    {subOrg.lat != null && subOrg.lng != null
                      ? `${subOrg.lat.toFixed(4)}, ${subOrg.lng.toFixed(4)}`
                      : "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Geofence radius:</span>
                  <span className="text-zinc-200">{subOrg.geoRadiusM ?? 500} meters</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400 border-t border-zinc-800/60 pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#e78a53]" />
                    Office hours:
                  </span>
                  <span className="text-zinc-200">
                    {subOrg.officeStartTime ? subOrg.officeStartTime.substring(0, 5) : "08:30"} -{" "}
                    {subOrg.officeEndTime ? subOrg.officeEndTime.substring(0, 5) : "17:30"}
                  </span>
                </div>
                {subOrg.graceMinutes != null && (
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Grace period:</span>
                    <span className="text-zinc-200">+{subOrg.graceMinutes} mins late allowed</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-zinc-800/80">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRenameSubOrg(subOrg)
                    setRenameModalOpen(true)
                  }}
                  className="border-zinc-800 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-xs"
                >
                  <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                  Rename
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditSubOrg(subOrg)
                      setEditModalOpen(true)
                    }}
                    className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit Details
                  </Button>
                  {!subOrg.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === subOrg.id}
                      onClick={() => handleDelete(subOrg)}
                      className="text-red-400 hover:bg-red-500/10 hover:text-red-300 p-2"
                    >
                      {deletingId === subOrg.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateSubOrgModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchSubOrgs}
      />

      <EditSubOrgModal
        subOrg={editSubOrg}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={fetchSubOrgs}
      />

      <RenameSubOrgModal
        subOrg={renameSubOrg}
        open={renameModalOpen}
        onOpenChange={setRenameModalOpen}
        onSuccess={fetchSubOrgs}
      />
    </div>
  )
}
