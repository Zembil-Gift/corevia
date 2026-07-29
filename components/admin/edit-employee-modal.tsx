"use client"

import { useEffect, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLang, pick } from "@/lib/i18n"
import { a } from "@/lib/i18n-admin"
import type { EmployeeApi } from "@/lib/employees-api"
import { EmployeePhotoUpload } from "@/components/admin/employee-photo-upload"
import { DAY_OF_WEEK_VALUES, type DayOfWeekApi } from "@/lib/employees-api"

const c = {
  editEmployee: { en: "Edit employee", am: "ሰራተኛ አርትዕ" },
  linkedin: { en: "LinkedIn URL", am: "የLinkedIn URL" },
  salaryDate: { en: "Salary date", am: "የደመወዝ ቀን" },
  grossSalary: { en: "Gross salary amount", am: "የጠቅላላ ደመወዝ መጠን" },
  grossHint: {
    en: "Enter the gross salary. Income tax and pension are deducted automatically.",
    am: "ጠቅላላ ደመወዝ ያስገቡ። የገቢ ግብር እና ጡረታ በራስ-ሰር ይቀነሳሉ።",
  },
  scheduleDays: { en: "Office schedule days", am: "የቢሮ የስራ ቀናት" },
  activeEmployee: { en: "Active employee", am: "ንቁ ሰራተኛ" },
  invalidSalary: { en: "Salary amount must be a valid non-negative number", am: "የደመወዝ መጠን ትክክለኛ አሉታዊ ያልሆነ ቁጥር መሆን አለበት" },
  failed: { en: "Failed to update employee", am: "ሰራተኛ ማዘመን አልተሳካም" },
  photoFailed: { en: "Failed to upload employee photo", am: "የሰራተኛ ፎቶ መስቀል አልተሳካም" },
}

interface EditEmployeeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: EmployeeApi | null
  onSuccess?: () => void
}

export function EditEmployeeModal({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EditEmployeeModalProps) {
  const { lang } = useLang()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [position, setPosition] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [salaryDate, setSalaryDate] = useState("")
  const [salaryAmountMajor, setSalaryAmountMajor] = useState("")
  const [salaryScheduleDays, setSalaryScheduleDays] = useState<DayOfWeekApi[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [active, setActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!employee || !open) return
    setName(employee.name ?? "")
    setEmail(employee.email ?? "")
    setPhone(employee.phone ?? "")
    setPosition(employee.position ?? "")
    setLinkedinUrl(employee.linkedinUrl ?? "")
    setSalaryDate(employee.salaryDate ?? "")
    setSalaryAmountMajor(
      typeof employee.salaryAmountMinor === "number" ? String(employee.salaryAmountMinor / 100) : ""
    )
    setSalaryScheduleDays(employee.salaryScheduleDays ?? [])
    setPhotoFile(null)
    setActive(employee.active ?? true)
    setError("")
  }, [employee, open])

  const toggleScheduleDay = (day: DayOfWeekApi) => {
    setSalaryScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee) return
    setError("")
    setSubmitting(true)
    try {
      const salaryAmountMinor =
        salaryAmountMajor.trim() === ""
          ? null
          : (() => {
              const parsedMajor = Number(salaryAmountMajor.trim())
              if (!Number.isFinite(parsedMajor) || parsedMajor < 0) {
                throw new Error(pick(lang, c.invalidSalary))
              }
              return Math.round(parsedMajor * 100)
            })()

      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          position: position.trim(),
          linkedinUrl: linkedinUrl.trim() || null,
          salaryDate: salaryDate || null,
          salaryAmountMinor,
          salaryScheduleDays,
          active,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? pick(lang, c.failed))
        setSubmitting(false)
        return
      }

      if (photoFile) {
        const formData = new FormData()
        formData.append("file", photoFile)
        const photoRes = await fetch(`/api/admin/employees/${employee.id}/photo`, {
          method: "POST",
          body: formData,
        })
        if (!photoRes.ok) {
          const photoData = await photoRes.json().catch(() => ({}))
          setError((photoData as { error?: string }).error ?? pick(lang, c.photoFailed))
          setSubmitting(false)
          return
        }
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : pick(lang, a.somethingWrong))
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
            <Dialog.Title className="text-xl font-semibold text-white">{pick(lang, c.editEmployee)}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label={pick(lang, a.close)}
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-employee-name" className="text-zinc-200">
                {pick(lang, a.name)}
              </Label>
              <Input
                id="edit-employee-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-employee-email" className="text-zinc-200">
                {pick(lang, a.email)}
              </Label>
              <Input
                id="edit-employee-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-employee-phone" className="text-zinc-200">
                {pick(lang, a.phone)}
              </Label>
              <Input
                id="edit-employee-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-employee-position" className="text-zinc-200">
                {pick(lang, a.position)}
              </Label>
              <Input
                id="edit-employee-position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-employee-linkedin" className="text-zinc-200">
                {pick(lang, c.linkedin)}
              </Label>
              <Input
                id="edit-employee-linkedin"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-employee-salary-date" className="text-zinc-200">
                  {pick(lang, c.salaryDate)}
                </Label>
                <Input
                  id="edit-employee-salary-date"
                  type="date"
                  value={salaryDate}
                  onChange={(e) => setSalaryDate(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-employee-salary-amount" className="text-zinc-200">
                  {pick(lang, c.grossSalary)}
                </Label>
                <Input
                  id="edit-employee-salary-amount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={salaryAmountMajor}
                  onChange={(e) => setSalaryAmountMajor(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
                <p className="text-xs text-zinc-500">
                  {pick(lang, c.grossHint)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-200">{pick(lang, c.scheduleDays)}</Label>
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
            <EmployeePhotoUpload
              file={photoFile}
              onChange={setPhotoFile}
              currentUrl={employee?.photo ?? ""}
            />

            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-800 text-[#e78a53] focus:ring-[#e78a53]/20"
              />
              {pick(lang, c.activeEmployee)}
            </label>

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
                    {pick(lang, a.saving)}
                  </>
                ) : (
                  pick(lang, a.saveChanges)
                )}
              </Button>
              <Dialog.Close asChild>
                <Button type="button" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  {pick(lang, a.cancel)}
                </Button>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
