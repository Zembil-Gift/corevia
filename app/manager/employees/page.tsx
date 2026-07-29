"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLang, pick } from "@/lib/i18n"
import { a } from "@/lib/i18n-admin"
import type { EmployeeApi } from "@/lib/employees-api"
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
}

export default function AdminEmployeesPage() {
  const { lang } = useLang()
  const [employees, setEmployees] = useState<EmployeeApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<EmployeeApi | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [attendanceEmployee, setAttendanceEmployee] = useState<EmployeeApi | null>(null)
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false)

  const fetchEmployeesList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/employees?page=0&size=100&sortBy=createdAt&direction=desc`)
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
  }, [])

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
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{pick(lang, t.employees)}</h1>
          <p className="mt-1 text-zinc-400">{pick(lang, t.subtitle)}</p>
        </div>
        <Button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
        >
          <Plus className="mr-2 size-4" />
          {pick(lang, t.addEmployee)}
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

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
