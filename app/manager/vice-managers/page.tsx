"use client"

import { useCallback, useEffect, useState } from "react"
import { ShieldCheck, Plus, Pencil, Trash2, Building2, Mail, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SubOrganization, ViceManager } from "@/lib/sub-orgs-api"
import { CreateViceManagerModal } from "@/components/admin/create-vice-manager-modal"
import { EditViceManagerModal } from "@/components/admin/edit-vice-manager-modal"

export default function ViceManagersPage() {
  const [viceManagers, setViceManagers] = useState<ViceManager[]>([])
  const [subOrgs, setSubOrgs] = useState<SubOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editViceManager, setEditViceManager] = useState<ViceManager | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [vmRes, subRes] = await Promise.all([
        fetch("/api/admin/vice-managers"),
        fetch("/api/admin/sub-organizations"),
      ])

      if (!vmRes.ok) {
        const data = await vmRes.json().catch(() => ({}))
        throw new Error(data.error ?? "Failed to load vice managers")
      }
      const vmData = await vmRes.json()
      setViceManagers(Array.isArray(vmData) ? vmData : [])

      if (subRes.ok) {
        const subData = await subRes.json()
        setSubOrgs(Array.isArray(subData) ? subData : [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
      setViceManagers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (vm: ViceManager) => {
    if (!confirm(`Are you sure you want to deactivate and remove vice manager "${vm.fullName}"?`)) return

    setDeletingId(vm.id)
    try {
      const res = await fetch(`/api/admin/vice-managers/${vm.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Failed to remove vice manager")
      }
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove vice manager")
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
            <ShieldCheck className="h-6 w-6 text-[#e78a53]" />
            <h1 className="text-2xl font-bold text-white">Vice Managers</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Assign branch administrators to view metrics, attendance, and reports for specific sub-organizations.
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-[#e78a53] hover:bg-[#e78a53]/90 text-white gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Vice Manager
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
      ) : viceManagers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-zinc-600" />
          <h3 className="mt-3 text-lg font-medium text-zinc-200">No vice managers yet</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Create vice managers to delegate attendance, performance, and peer-review monitoring for each branch.
          </p>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 bg-[#e78a53] hover:bg-[#e78a53]/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Vice Manager
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-lg">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-950/70 text-xs font-semibold uppercase text-zinc-400">
              <tr>
                <th className="px-6 py-4">Manager</th>
                <th className="px-6 py-4">Assigned Sub-Organization</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {viceManagers.map((vm) => (
                <tr key={vm.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{vm.fullName}</div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                      <Mail className="h-3 w-3 text-zinc-500" />
                      {vm.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {vm.subOrganizationName ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200">
                        <Building2 className="h-3.5 w-3.5 text-[#e78a53]" />
                        {vm.subOrganizationName}
                      </span>
                    ) : (
                      <span className="text-zinc-500 italic text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {vm.active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-400">
                    {vm.lastLoginAt ? new Date(vm.lastLoginAt).toLocaleString() : "Never"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditViceManager(vm)
                          setEditModalOpen(true)
                        }}
                        className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs"
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === vm.id}
                        onClick={() => handleDelete(vm)}
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300 p-2"
                      >
                        {deletingId === vm.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <CreateViceManagerModal
        subOrganizations={subOrgs}
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchData}
      />

      <EditViceManagerModal
        viceManager={editViceManager}
        subOrganizations={subOrgs}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={fetchData}
      />
    </div>
  )
}
