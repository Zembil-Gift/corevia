"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmployeePhotoUpload } from "@/components/admin/employee-photo-upload"
import { DAY_OF_WEEK_VALUES, type DayOfWeekApi } from "@/lib/employees-api"

interface CreateEmployeeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateEmployeeModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateEmployeeModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [position, setPosition] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [salaryDate, setSalaryDate] = useState("")
  const [salaryAmountMajor, setSalaryAmountMajor] = useState("")
  const [salaryScheduleDays, setSalaryScheduleDays] = useState<DayOfWeekApi[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const toggleScheduleDay = (day: DayOfWeekApi) => {
    setSalaryScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("name", name.trim())
      formData.append("email", email.trim())
      formData.append("phone", phone.trim())
      formData.append("position", position.trim())
      if (linkedinUrl.trim()) formData.append("linkedinUrl", linkedinUrl.trim())
      if (salaryDate) formData.append("salaryDate", salaryDate)
      if (salaryAmountMajor.trim()) {
        const parsedMajor = Number(salaryAmountMajor.trim())
        if (!Number.isFinite(parsedMajor) || parsedMajor < 0) {
          setError("Salary amount must be a valid non-negative number")
          setSubmitting(false)
          return
        }
        formData.append("salaryAmountMinor", String(Math.round(parsedMajor * 100)))
      }
      for (const day of salaryScheduleDays) {
        formData.append("salaryScheduleDays", day)
      }
      if (photoFile) formData.append("file", photoFile)

      const res = await fetch(`/api/admin/employees`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to create employee")
        setSubmitting(false)
        return
      }
      setName("")
      setEmail("")
      setPhone("")
      setPosition("")
      setLinkedinUrl("")
      setSalaryDate("")
      setSalaryAmountMajor("")
      setSalaryScheduleDays([])
      setPhotoFile(null)
      onOpenChange(false)
      onSuccess?.()
    } catch {
      setError("Something went wrong")
    }
    setSubmitting(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && !submitting) setError("")
    onOpenChange(next)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[10001] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold text-white">Create employee</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee-name" className="text-zinc-200">
                Name
              </Label>
              <Input
                id="employee-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-email" className="text-zinc-200">
                Email
              </Label>
              <Input
                id="employee-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-phone" className="text-zinc-200">
                Phone
              </Label>
              <Input
                id="employee-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-position" className="text-zinc-200">
                Position
              </Label>
              <Input
                id="employee-position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-linkedin" className="text-zinc-200">
                LinkedIn URL
              </Label>
              <Input
                id="employee-linkedin"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employee-salary-date" className="text-zinc-200">
                  Salary date
                </Label>
                <Input
                  id="employee-salary-date"
                  type="date"
                  value={salaryDate}
                  onChange={(e) => setSalaryDate(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee-salary-amount" className="text-zinc-200">
                  Salary amount
                </Label>
                <Input
                  id="employee-salary-amount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={salaryAmountMajor}
                  onChange={(e) => setSalaryAmountMajor(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-200">Office schedule days</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DAY_OF_WEEK_VALUES.map((day) => (
                  <label key={day} className="flex items-center gap-2 rounded-md border border-zinc-700 px-2 py-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={salaryScheduleDays.includes(day)}
                      onChange={() => toggleScheduleDay(day)}
                      className="rounded border-zinc-700 bg-zinc-800 text-[#e78a53] focus:ring-[#e78a53]/20"
                    />
                    <span className="text-zinc-300">{day.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>
            <EmployeePhotoUpload file={photoFile} onChange={setPhotoFile} />

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create employee"
                )}
              </Button>
              <Dialog.Close asChild>
                <Button type="button" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Cancel
                </Button>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
