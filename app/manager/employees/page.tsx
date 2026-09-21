"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2, Clock, Building2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLang, pick } from "@/lib/i18n"
import { a } from "@/lib/i18n-admin"
import type { EmployeeApi } from "@/lib/employees-api"
import type { SubOrganization } from "@/lib/sub-orgs-api"
import { isViceManagerClient } from "@/lib/admin-client-auth"
import { CreateEmployeeModal } from "@/components/admin/create-employee-modal"
import { EditEmployeeModal } from "@/components/admin/edit-employee-modal"
import { AttendanceModal } from "@/components/admin/attendance-modal"

const t = {
  employees: { en: "Employees", am: "ሰራተኞች" },
  subtitle: { en: "Manage employee accounts", am: "የሰራተኞች መለያዎችን ያስተዳድሩ" },
  addEmployee: { en: "Add employee", am: "ሰራተኛ ጨምር" },
  grossSalary: { en: "Gross salary", am: "ጠቅላላ ደመወዝ" },
  dateLabel: { en: "Date", am: "ቀን" },
  viewAttendance: { en: "View attendance for", am: "መገኘት ይመልከቱ ለ" },
  employeesCount: { en: "employees", am: "ሰራተኞች" },
  confirmDelete: { en: "Delete", am: "ይሰረዝ" },
  failedLoad: { en: "Failed to load employees", am: "ሰራተኞችን መጫን አልተሳካም" },
  failedDelete: { en: "Failed to delete employee", am: "ሰራተኛ መሰረዝ አልተሳካም" },
  allBranches: { en: "All Sub-Organizations", am: "ሁሉም ቅርንጫፎች" },
}

export default function AdminEmployeesPage() {
  const { lang } = useLang()
  const [employees, setEmployees] = useState<EmployeeApi[]>([])
  const [subOrgs, setSubOrgs] = useState<SubOrganization[]>([])
  const [selectedSubOrgId, setSelectedSubOrgId] = useState<string>("")
  const [isVice, setIsVice] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<EmployeeApi | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [attendanceEmployee, setAttendanceEmployee] = useState<EmployeeApi | null>(null)
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false)

  useEffect(() => {
    setIsVice(isViceManagerClient())
    fetch("/api/admin/sub-organizations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSubOrgs(data)
      })
      .catch(() => {})
  }, [])

  const fetchEmployeesList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = selectedSubOrgId
        ? `/api/admin/employees?subOrganizationId=${selectedSubOrgId}&page=0&size=100&sortBy=createdAt&direction=desc`
        : `/api/admin/employees?page=0&size=100&sortBy=createdAt&direction=desc`
      const res = await fetch(url)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `Failed to load: ${res.status}`)
      }
      const data = await res.json()
      setEmployees(data.content ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : pick(lang, t.failedLoad))
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }, [selectedSubOrgId])

  useEffect(() => {
    fetchEmployeesList()
  }, [fetchEmployeesList])

  const openEditModal = (employee: EmployeeApi) => {
    setEditEmployee(employee)
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditEmployee(null)
  }

  const formatSalaryAmount = (amountMinor: number | null | undefined) => {
    if (typeof amountMinor !== "number") return "-"
    return `${new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountMinor / 100)} ETB`
  }

  const handleDelete = async (employee: EmployeeApi) => {
    if (!confirm(`${pick(lang, t.confirmDelete)} "${employee.name}"?`)) return
    setDeletingId(employee.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "DELETE",
      })
      if (res.ok || res.status === 204) {
        fetchEmployeesList()
      } else {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? pick(lang, t.failedDelete))
      }

    } catch {
      setError(pick(lang, t.failedDelete))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">{pick(lang, t.employees)}</h1>
          <p className="mt-1 text-sm text-zinc-400">{pick(lang, t.subtitle)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sub-Org Filter (visible to main manager with multiple subOrgs) */}
          {!isVice && subOrgs.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400" />
              <select
                value={selectedSubOrgId}
                onChange={(e) => setSelectedSubOrgId(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#e78a53]"
              >
                <option value="">{pick(lang, t.allBranches)}</option>
                {subOrgs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isDefault ? "(Main)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isVice ? (
            <Button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90 gap-2"
            >
              <Plus className="size-4" />
              {pick(lang, t.addEmployee)}
            </Button>
          ) : (
            <span className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#e78a53]" />
              Branch Manager View
            </span>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-[#e78a53]" aria-hidden />
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, a.name)}</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, a.email)}</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Branch</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, a.position)}</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, t.grossSalary)}</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, a.status)}</th>
                  <th className="w-24 px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{pick(lang, a.actions)}</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-zinc-800/80 transition-colors hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <span className="font-medium text-white">{employee.name}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{employee.email}</td>
                    <td className="px-4 py-3">
                      {employee.subOrganizationName ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                          <Building2 className="h-3 w-3 text-[#e78a53]" />
                          {employee.subOrganizationName}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{employee.position}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      <div className="text-sm text-zinc-300">{formatSalaryAmount(employee.salaryAmountMinor)}</div>
                      {employee.salaryDate && (
                        <div className="text-xs text-zinc-500">{pick(lang, t.dateLabel)}: {employee.salaryDate}</div>
                      )}
                      {employee.salaryScheduleDays && employee.salaryScheduleDays.length > 0 && (
                        <div className="text-xs text-zinc-500">
                          {employee.salaryScheduleDays.map((day) => day.slice(0, 3)).join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          employee.active
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-zinc-600/30 text-zinc-400"
                        }`}
                      >
                        {pick(lang, employee.active ? a.active : a.inactive)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!isVice && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-1 text-zinc-400 hover:text-white"
                            onClick={() => openEditModal(employee)}
                            aria-label={`${pick(lang, a.edit)} ${employee.name}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-1 text-zinc-400 hover:text-white"
                          onClick={() => {
                            setAttendanceEmployee(employee)
                            setAttendanceModalOpen(true)
                          }}
                          aria-label={`${pick(lang, t.viewAttendance)} ${employee.name}`}
                        >
                          <Clock className="size-4" />
                        </Button>
                        {!isVice && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-1 text-zinc-400 hover:text-red-400"
                            onClick={() => handleDelete(employee)}
                            disabled={deletingId === employee.id}
                            aria-label={`${pick(lang, a.delete)} ${employee.name}`}
                          >
                            {deletingId === employee.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            {employees.length} {pick(lang, t.employeesCount)}
          </p>
        </>
      )}

      <CreateEmployeeModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchEmployeesList}
      />
      <EditEmployeeModal
        open={editModalOpen}
        onOpenChange={(open) => !open && closeEditModal()}
        employee={editEmployee}
        onSuccess={() => {
          closeEditModal()
          fetchEmployeesList()
        }}
      />
      <AttendanceModal
        open={attendanceModalOpen}
        onOpenChange={setAttendanceModalOpen}
        employee={attendanceEmployee}
      />
    </div>
  )
}
