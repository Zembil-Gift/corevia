"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  Camera,
  Clock,
  CreditCard,
  Key,
  Link2,
  Loader2,
  LogOut,
  MessageSquare,
  Pencil,
  QrCode,
  Star,
  Bell,
  User,
  X,
} from "lucide-react"
import QRCode from "react-qr-code"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LangToggle } from "@/components/mahberix/lang-toggle"
import { useLang, pick } from "@/lib/i18n"
import { clearAdminClientToken } from "@/lib/admin-client-auth"
import { QRScanner } from "@/components/employee/qr-scanner"
import { useUnreadCount } from "@/components/notifications/use-unread-count"

const t = {
  portal: { en: "Employee Portal", am: "የሰራተኛ ፖርታል" },
  portalSub: { en: "Manage your account, reports, and payments.", am: "መለያዎን፣ ሪፖርቶችዎን እና ክፍያዎችዎን ያስተዳድሩ።" },
  connect: { en: "Connect", am: "አገናኝ" },
  password: { en: "Password", am: "የይለፍ ቃል" },
  logout: { en: "Log out", am: "ውጣ" },
  cancel: { en: "Cancel", am: "ተወው" },
  update: { en: "Update", am: "አዘምን" },
  grossSalary: { en: "Gross salary", am: "ጠቅላላ ደመወዝ" },
  due: { en: "Due", am: "የሚከፈልበት" },
  officeDays: { en: "Office Days", am: "የቢሮ ቀናት" },
  report: { en: "Report", am: "ሪፖርት" },
  payments: { en: "Payments", am: "ክፍያዎች" },
  peerReview: { en: "Peer Review", am: "የእኩዮች ግምገማ" },
  myReview: { en: "My Review", am: "የእኔ ግምገማ" },
  notifications: { en: "Notifications", am: "ማሳወቂያዎች" },
  changePassword: { en: "Change Password", am: "የይለፍ ቃል ቀይር" },
  currentPassword: { en: "Current password", am: "የአሁኑ የይለፍ ቃል" },
  newPassword: { en: "New password", am: "አዲስ የይለፍ ቃል" },
  updating: { en: "Updating...", am: "በማዘመን ላይ..." },
  updatePassword: { en: "Update password", am: "የይለፍ ቃል አዘምን" },
  attendanceQr: { en: "Attendance QR", am: "የመገኘት QR" },
  connectedAccounts: { en: "Connected Accounts", am: "የተገናኙ መለያዎች" },
  githubUsername: { en: "GitHub username", am: "የGitHub የተጠቃሚ ስም" },
  trelloUsername: { en: "Trello username", am: "የTrello የተጠቃሚ ስም" },
  connectWarn: {
    en: "Updating your connected accounts will reset your existing report progress. Your previous stats will be lost.",
    am: "የተገናኙ መለያዎችዎን ማዘመን ነባር የሪፖርት እድገትዎን ዳግም ያስጀምራል። የቀድሞ ስታቲስቲክስዎ ይጠፋል።",
  },
  saving: { en: "Saving...", am: "በማስቀመጥ ላይ..." },
  editPhoto: { en: "Edit Photo", am: "ፎቶ አርትዕ" },
  changePhoto: { en: "Change photo", am: "ፎቶ ቀይር" },
  uploadPhoto: { en: "Upload photo", am: "ፎቶ ስቀል" },
  photoHint: { en: "PNG, JPG, GIF, or WEBP (max 5 MB)", am: "PNG, JPG, GIF ወይም WEBP (ቢበዛ 5 ሜባ)" },
  uploading: { en: "Uploading...", am: "በመስቀል ላይ..." },
  scanAttendance: { en: "Attendance", am: "መገኘት ቃኝ" },
  clockIn: { en: "Clock In", am: "ግቤት" },
  clockOut: { en: "Clock Out", am: "ውጤት" },
  lunchBreakIn: { en: "Lunch Break In", am: "ምሳ ዕረፍት ግቤት" },
  lunchBreakOut: { en: "Lunch Break Out", am: "ምሳ ዕረፍት ውጤት" },
  selectAction: { en: "Select an action, then scan the QR code.", am: "ድርጊት ይምረጡ፣ ከዚያ QR ኮድ ያንበቡ።" },
  recordingAttendance: { en: "Recording attendance...", am: "መገኘት በመመዝገብ ላይ..." },
}

interface EmployeeInfo {
  id: number
  name: string
  email: string
  phone: string
  position: string
  photo?: string | null
  linkedinUrl?: string | null
  salaryDate?: string | null
  salaryAmountMinor?: number | null
  salaryScheduleDays?: string[]
}

type EmployeeShellProps = {
  children: React.ReactNode
}

export function EmployeeShell({ children }: EmployeeShellProps) {
  const { lang } = useLang()
  const pathname = usePathname()
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showConnectForm, setShowConnectForm] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState<{
    githubUsername?: string | null
    trelloUsername?: string | null
  } | null>(null)
  const [connectForm, setConnectForm] = useState({ githubUsername: "", trelloUsername: "" })
  const [connectSubmitting, setConnectSubmitting] = useState(false)
  const [connectError, setConnectError] = useState("")
  const [connectSuccess, setConnectSuccess] = useState("")

  const [showPhotoForm, setShowPhotoForm] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoSubmitting, setPhotoSubmitting] = useState(false)
  const [photoError, setPhotoError] = useState("")
  const [photoSuccess, setPhotoSuccess] = useState("")

  const [showAttendancePanel, setShowAttendancePanel] = useState(false)
  const [attendanceAction, setAttendanceAction] = useState<"clockIn" | "clockOut" | "lunchBreakIn" | "lunchBreakOut" | null>(null)
  const [showAttendanceScanner, setShowAttendanceScanner] = useState(false)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceMessage, setAttendanceMessage] = useState("")

  const unread = useUnreadCount("employee")

  const tabs = useMemo(
    () => [
      { href: "/employee/reports", label: t.report, icon: BarChart3 },
      { href: "/employee/payments", label: t.payments, icon: CreditCard },
      { href: "/employee/peer-reviews", label: t.peerReview, icon: MessageSquare },
      { href: "/employee/my-review", label: t.myReview, icon: Star },
      { href: "/employee/notifications", label: t.notifications, icon: Bell },
    ],
    []
  )

  const fetchEmployee = useCallback(async () => {
    try {
      const res = await fetch("/api/employee/me")
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? "Failed to fetch profile")
      }
      const data = await res.json()
      setEmployee(data)
    } catch (err) {
      console.error("Failed to fetch employee:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchConnectedAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/employee/me/connected-accounts")
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return
      setConnectedAccounts(data)
      setConnectForm({
        githubUsername: data.githubUsername ?? "",
        trelloUsername: data.trelloUsername ?? "",
      })
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchEmployee()
    fetchConnectedAccounts()
  }, [fetchEmployee, fetchConnectedAccounts])

  const handleOpenConnect = () => {
    setConnectError("")
    setConnectSuccess("")
    setShowConnectForm(true)
  }

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnectError("")
    setConnectSuccess("")
    setConnectSubmitting(true)
    try {
      const hasExisting =
        connectedAccounts?.githubUsername ||
        connectedAccounts?.trelloUsername
      const body: Record<string, string | null> = {}
      const g = connectForm.githubUsername.trim()
      const t = connectForm.trelloUsername.trim()
      body.githubUsername = g || null
      body.trelloUsername = t || null

      const res = await fetch("/api/employee/me/connected-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setConnectError((data as { error?: string }).error ?? "Failed to update connected accounts")
        setConnectSubmitting(false)
        return
      }
      setConnectedAccounts(data)
      setConnectSuccess(hasExisting ? "Connected accounts updated." : "Connected accounts saved.")
      setConnectSubmitting(false)
      setTimeout(() => {
        setShowConnectForm(false)
        setConnectSuccess("")
      }, 2000)
    } catch {
      setConnectError("Something went wrong. Please try again.")
      setConnectSubmitting(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/employee/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.status === 204) {
        setCurrentPassword("")
        setNewPassword("")
        setSuccess("Password changed successfully.")
        setIsSubmitting(false)
        setTimeout(() => {
          setShowPasswordForm(false)
          setSuccess("")
        }, 2000)
        return
      }
      const data = await res.json().catch(() => ({}))
      setError((data as { error?: string }).error ?? "Failed to change password")
    } catch {
      setError("Something went wrong. Please try again.")
    }
    setIsSubmitting(false)
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    clearAdminClientToken()
    window.location.href = "/login"
  }

  const handleOpenPhoto = () => {
    setPhotoError("")
    setPhotoSuccess("")
    setPhotoFile(null)
    setPhotoPreview(employee?.photo ?? null)
    setShowPhotoForm(true)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Photo must be 5 MB or smaller")
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setPhotoError("")
  }

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!photoFile) {
      setPhotoError("Please select a photo")
      return
    }
    setPhotoError("")
    setPhotoSuccess("")
    setPhotoSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("photo", photoFile)

      const res = await fetch("/api/employee/me/photo", {
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setPhotoError((data as { error?: string }).error ?? "Failed to upload photo")
        setPhotoSubmitting(false)
        return
      }
      setEmployee(data)
      setPhotoSuccess("Photo updated.")
      setPhotoSubmitting(false)
      setTimeout(() => {
        setShowPhotoForm(false)
        setPhotoSuccess("")
      }, 2000)
    } catch {
      setPhotoError("Something went wrong. Please try again.")
      setPhotoSubmitting(false)
    }
  }

  const getCurrentPosition = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"))
        return
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
    })

  const handleAttendanceAction = (action: "clockIn" | "clockOut" | "lunchBreakIn" | "lunchBreakOut") => {
    setAttendanceAction(action)
    setShowAttendanceScanner(true)
    setAttendanceMessage("")
  }

  const handleAttendanceQRScan = async (qrData: string) => {
    setShowAttendanceScanner(false)
    setAttendanceLoading(true)
    setAttendanceMessage("")

    const email = qrData.trim()
    if (!email) {
      setAttendanceMessage("Invalid QR code. Please scan an employee QR code.")
      setAttendanceLoading(false)
      setAttendanceAction(null)
      return
    }

    if (!attendanceAction) {
      setAttendanceMessage("Select an attendance action first.")
      setAttendanceLoading(false)
      setAttendanceAction(null)
      return
    }

    let position: GeolocationPosition
    try {
      position = await getCurrentPosition()
    } catch {
      setAttendanceMessage("Location access is required to record attendance.")
      setAttendanceLoading(false)
      setAttendanceAction(null)
      return
    }

    try {
      const res = await fetch("/api/employee/attendance/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: attendanceAction,
          email,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setAttendanceMessage((data as { error?: string }).error ?? "Failed to record attendance")
      } else {
        const actionMessage =
          attendanceAction === "clockIn"
            ? "Clock in recorded successfully!"
            : attendanceAction === "clockOut"
              ? "Clock out recorded successfully!"
              : attendanceAction === "lunchBreakIn"
                ? "Lunch break start recorded successfully!"
                : "Lunch break end recorded successfully!"
        setAttendanceMessage(actionMessage)
      }
    } catch {
      setAttendanceMessage("Failed to record attendance. Please try again.")
    }

    setAttendanceLoading(false)
    setAttendanceAction(null)
  }

  const formatMoney = (amountMinor: number | null) =>
    amountMinor === null
      ? "-"
      : `${new Intl.NumberFormat(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amountMinor / 100)} ETB`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="size-8 animate-spin text-[#e78a53]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="min-w-0 shrink-0">
            <h1 className="text-2xl font-bold text-white">{pick(lang, t.portal)}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {pick(lang, t.portalSub)}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <LangToggle />
            <Button
              variant="outline"
              size="sm"
              className={showAttendancePanel
                ? "border-[#e78a53] bg-[#e78a53]/10 text-[#e78a53] hover:bg-[#e78a53]/20"
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              }
              onClick={() => {
                setShowAttendancePanel(!showAttendancePanel)
                setAttendanceMessage("")
                setAttendanceAction(null)
              }}
            >
              <Camera className="mr-2 size-4" />
              {pick(lang, t.scanAttendance)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => setShowQrModal(true)}
            >
              <QrCode className="mr-2 size-4" />
            
            </Button>
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={handleOpenConnect}
            >
              <Link2 className="mr-2 size-4" />
              {pick(lang, t.connect)}
            </Button>
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => setShowPasswordForm(true)}
            >
              <Key className="mr-2 size-4" />
              {pick(lang, t.password)}
            </Button>
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 size-4" />
              {pick(lang, t.logout)}
            </Button>
          </div>
        </div>


        {employee && (
          <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-4">
              <div
                className="group relative cursor-pointer"
                onClick={handleOpenPhoto}
              >
                {employee.photo ? (
                  <img
                    src={employee.photo}
                    alt={employee.name}
                    className="size-12 rounded-full object-cover ring-2 ring-zinc-700 group-hover:opacity-50 transition-opacity"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-zinc-700 group-hover:opacity-50 transition-opacity">
                    <User className="size-6 text-zinc-500" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil className="size-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{employee.name}</h2>
                <p className="text-base font-medium text-zinc-300">
                  {employee.position}
                </p>
                {(employee.salaryDate ||
                  typeof employee.salaryAmountMinor === "number") && (
                  <p className="mt-1 text-sm text-zinc-400">
                    {pick(lang, t.grossSalary)}: {formatMoney(employee.salaryAmountMinor ?? null)}
                    {employee.salaryDate ? ` • ${pick(lang, t.due)} ${employee.salaryDate}` : ""}
                  </p>
                )}
                {(employee.salaryScheduleDays && employee.salaryScheduleDays.length > 0) && (
                  <p className="mt-1 text-sm text-zinc-400">
                    {pick(lang, t.officeDays)}: {employee.salaryScheduleDays.join(", ")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">{employee.email}</p>
                {employee.phone && <p className="text-sm text-zinc-400">{employee.phone}</p>}
                
              </div>
            </div>
          </section>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (pathname ? pathname.startsWith(`${tab.href}/`) : false)
            const Icon = tab.icon
            return (
              <Button
                key={tab.href}
                asChild
                className={
                  isActive
                    ? "bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }
              >
                <Link href={tab.href}>
                  <Icon className="mr-2 size-4" />
                  {pick(lang, tab.label)}
                  {tab.href === "/employee/notifications" && unread > 0 && (
                    <span className="ml-2 rounded-full bg-white/90 px-1.5 text-[11px] font-semibold text-zinc-900" aria-label={`${unread} unread`}>
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </Link>
              </Button>
            )
          })}
        </div>

        {children}
      </main>

      {showPasswordForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{pick(lang, t.changePassword)}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(false)}>
                <span className="text-zinc-400 hover:text-white">✕</span>
              </Button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-zinc-200">
                  {pick(lang, t.currentPassword)}
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-zinc-200">
                  {pick(lang, t.newPassword)}
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}

              {success && (
                <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                  {success}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                >
                  {isSubmitting ? pick(lang, t.updating) : pick(lang, t.updatePassword)}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordForm(false)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  {pick(lang, t.cancel)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQrModal && employee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{pick(lang, t.attendanceQr)}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowQrModal(false)}>
                <span className="text-zinc-400 hover:text-white">✕</span>
              </Button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-lg bg-white p-4">
                <QRCode value={employee.email} size={240} />
              </div>
          
            </div>
          </div>
          
        </div>
      )}

      {showConnectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{pick(lang, t.connectedAccounts)}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowConnectForm(false)}>
                <span className="text-zinc-400 hover:text-white">✕</span>
              </Button>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connect-github" className="text-zinc-200">
                  {pick(lang, t.githubUsername)}
                </Label>
                <Input
                  id="connect-github"
                  placeholder="e.g. serdesiyont (without @)"
                  value={connectForm.githubUsername}
                  onChange={(e) =>
                    setConnectForm((prev) => ({ ...prev, githubUsername: e.target.value }))
                  }
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="connect-trello" className="text-zinc-200">
                  {pick(lang, t.trelloUsername)}
                </Label>
                <Input
                  id="connect-trello"
                  placeholder="e.g. serdesiyont (without @)"
                  value={connectForm.trelloUsername}
                  onChange={(e) =>
                    setConnectForm((prev) => ({ ...prev, trelloUsername: e.target.value }))
                  }
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              {connectedAccounts && (connectedAccounts.githubUsername || connectedAccounts.trelloUsername) && (
                <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                  {pick(lang, t.connectWarn)}
                </p>
              )}

              {connectError && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {connectError}
                </p>
              )}
              {connectSuccess && (
                <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                  {connectSuccess}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={connectSubmitting}
                  className="flex-1 bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                >
                  {connectSubmitting ? pick(lang, t.saving) : connectedAccounts && (connectedAccounts.githubUsername || connectedAccounts.trelloUsername) ? pick(lang, t.update) : pick(lang, t.connect)}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConnectForm(false)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  {pick(lang, t.cancel)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPhotoForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{pick(lang, t.editPhoto)}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPhotoForm(false)}>
                <span className="text-zinc-400 hover:text-white">✕</span>
              </Button>
            </div>

            <form onSubmit={handlePhotoSubmit} className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile preview"
                    className="size-24 rounded-full object-cover ring-2 ring-zinc-700"
                  />
                ) : (
                  <div className="flex size-24 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-zinc-700">
                    <User className="size-10 text-zinc-500" />
                  </div>
                )}
                <Label
                  htmlFor="profile-photo"
                  className="cursor-pointer text-sm text-[#e78a53] hover:underline"
                >
                  {photoPreview && photoPreview !== employee?.photo ? pick(lang, t.changePhoto) : pick(lang, t.uploadPhoto)}
                </Label>
                <Input
                  id="profile-photo"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <p className="text-xs text-zinc-500">{pick(lang, t.photoHint)}</p>
              </div>

              {photoError && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {photoError}
                </p>
              )}
              {photoSuccess && (
                <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                  {photoSuccess}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={photoSubmitting || !photoFile}
                  className="flex-1 bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
                >
                  {photoSubmitting ? pick(lang, t.uploading) : pick(lang, t.uploadPhoto)}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPhotoForm(false)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  {pick(lang, t.cancel)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAttendancePanel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => {
            setShowAttendancePanel(false)
            setAttendanceMessage("")
            setAttendanceAction(null)
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-[#e78a53]" />
                <h3 className="text-lg font-semibold text-white">{pick(lang, t.scanAttendance)}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAttendancePanel(false)
                  setAttendanceMessage("")
                  setAttendanceAction(null)
                }}
              >
                <X className="size-5 text-zinc-400 hover:text-white" />
              </Button>
            </div>

            {attendanceMessage && (
              <p
                className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                  attendanceMessage.includes("success")
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/20 bg-red-500/10 text-red-400"
                }`}
              >
                {attendanceMessage}
              </p>
            )}

            {attendanceLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin text-[#e78a53]" />
                <span className="text-zinc-400">{pick(lang, t.recordingAttendance)}</span>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={() => handleAttendanceAction("clockIn")}
                    className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                  >
                    <Clock className="mr-2 size-4" />
                    {pick(lang, t.clockIn)}
                  </Button>
                  <Button
                    onClick={() => handleAttendanceAction("lunchBreakIn")}
                    className="bg-sky-700 text-white hover:bg-sky-700/90"
                  >
                    <Clock className="mr-2 size-4" />
                    {pick(lang, t.lunchBreakIn)}
                  </Button>
                  <Button
                    onClick={() => handleAttendanceAction("lunchBreakOut")}
                    className="bg-indigo-700 text-white hover:bg-indigo-700/90"
                  >
                    <Clock className="mr-2 size-4" />
                    {pick(lang, t.lunchBreakOut)}
                  </Button>
                  <Button
                    onClick={() => handleAttendanceAction("clockOut")}
                    className="bg-orange-600 text-white hover:bg-orange-600/90"
                  >
                    <Clock className="mr-2 size-4" />
                    {pick(lang, t.clockOut)}
                  </Button>
                </div>
                <p className="mt-3 text-sm text-zinc-500">
                  {pick(lang, t.selectAction)}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {showAttendanceScanner && (
        <QRScanner
          onScan={handleAttendanceQRScan}
          onClose={() => {
            setShowAttendanceScanner(false)
            setAttendanceAction(null)
          }}
        />
      )}
    </div>
  )
}
