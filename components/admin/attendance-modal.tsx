"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Loader2, Calendar, Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EmployeeApi } from "@/lib/employees-api"

interface AttendanceRecord {
  id: number
  employeeId: number
  date: string
  clockInAt: string
  clockOutAt: string | null
  lunchBreakInAt: string | null
  lunchBreakOutAt: string | null
  createdAt: string
  updatedAt: string
}

interface AttendanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: EmployeeApi | null
}

export function AttendanceModal({ open, onOpenChange, employee }: AttendanceModalProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    clockInAt: "",
    clockOutAt: "",
    lunchBreakInAt: "",
    lunchBreakOutAt: "",
  })

  const fetchAttendance = async () => {
    if (!employee) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}/attendance`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Failed to load attendance")
      }
      const data = await res.json()
      const sortedData = Array.isArray(data) 
        ? [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : []
      setAttendance(sortedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attendance")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && employee) {
      fetchAttendance()
      setShowForm(false)
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        clockInAt: "",
        clockOutAt: "",
        lunchBreakInAt: "",
        lunchBreakOutAt: "",
      })
    }
  }, [open, employee])

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    if (!employee) return
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        date: formData.date,
        clockInAt: new Date(`${formData.date}T${formData.clockInAt}`).toISOString(),
        clockOutAt: new Date(`${formData.date}T${formData.clockOutAt}`).toISOString(),
        lunchBreakInAt: formData.lunchBreakInAt
          ? new Date(`${formData.date}T${formData.lunchBreakInAt}`).toISOString()
          : null,
        lunchBreakOutAt: formData.lunchBreakOutAt
          ? new Date(`${formData.date}T${formData.lunchBreakOutAt}`).toISOString()
          : null,
      }

      const res = await fetch(`/api/admin/employees/${employee.id}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Failed to save attendance")
      }

      setShowForm(false)
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        clockInAt: "",
        clockOutAt: "",
        lunchBreakInAt: "",
        lunchBreakOutAt: "",
      })
      fetchAttendance()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save attendance")
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-"
    return format(new Date(isoString), "HH:mm")
  }

  if (!employee) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${open ? "" : "hidden"}`}>
      <div className="absolute inset-0 bg-black/60" onClick={() => handleOpen(false)} />
      <div className="relative z-10 mx-4 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Attendance</h2>
            <p className="text-sm text-zinc-400">{employee.name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white"
            onClick={() => handleOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {!showForm && (
            <div className="mb-4">
              <Button
                onClick={() => setShowForm(true)}
                className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
              >
                <Clock className="mr-2 size-4" />
                Add Attendance
              </Button>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
              <h3 className="mb-4 font-medium text-white">Add/Update Attendance</h3>
              
              {error && (
                <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-zinc-200">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clockIn" className="text-zinc-200">Clock In</Label>
                  <Input
                    id="clockIn"
                    type="time"
                    value={formData.clockInAt}
                    onChange={(e) => setFormData({ ...formData, clockInAt: e.target.value })}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clockOut" className="text-zinc-200">Clock Out</Label>
                  <Input
                    id="clockOut"
                    type="time"
                    value={formData.clockOutAt}
                    onChange={(e) => setFormData({ ...formData, clockOutAt: e.target.value })}
                    required
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lunchIn" className="text-zinc-200">Lunch Break In</Label>
                  <Input
                    id="lunchIn"
                    type="time"
                    value={formData.lunchBreakInAt}
                    onChange={(e) => setFormData({ ...formData, lunchBreakInAt: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lunchOut" className="text-zinc-200">Lunch Break Out</Label>
                  <Input
                    id="lunchOut"
                    type="time"
                    value={formData.lunchBreakOutAt}
                    onChange={(e) => setFormData({ ...formData, lunchBreakOutAt: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                >
                  {submitting ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-[#e78a53]" />
            </div>
          ) : attendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
              <Calendar className="mb-2 size-8" />
              <p>No attendance records found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-zinc-500" />
                    <span className="font-medium text-white">{record.date}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Clock className="size-3" />
                      <span>In: {formatTime(record.clockInAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Clock className="size-3" />
                      <span>Out: {formatTime(record.clockOutAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Clock className="size-3" />
                      <span>Lunch: {formatTime(record.lunchBreakInAt)} - {formatTime(record.lunchBreakOutAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}