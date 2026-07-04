"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  CreditCard,
  Key,
  Link2,
  Loader2,
  LogOut,
  MessageSquare,
  Pencil,
  QrCode,
  Star,
  User,
} from "lucide-react"
import QRCode from "react-qr-code"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { clearAdminClientToken } from "@/lib/admin-client-auth"

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
    telegramUsername?: string | null
  } | null>(null)
  const [connectForm, setConnectForm] = useState({ githubUsername: "", trelloUsername: "", telegramUsername: "" })
  const [connectSubmitting, setConnectSubmitting] = useState(false)
  const [connectError, setConnectError] = useState("")
  const [connectSuccess, setConnectSuccess] = useState("")

  const [showPhotoForm, setShowPhotoForm] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoSubmitting, setPhotoSubmitting] = useState(false)
  const [photoError, setPhotoError] = useState("")
  const [photoSuccess, setPhotoSuccess] = useState("")

  const tabs = useMemo(
    () => [
      { href: "/employee/reports", label: "Report", icon: BarChart3 },
      { href: "/employee/payments", label: "Payments", icon: CreditCard },
      { href: "/employee/peer-reviews", label: "Peer Review", icon: MessageSquare },
      { href: "/employee/my-review", label: "My Review", icon: Star },
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
        telegramUsername: data.telegramUsername ?? "",
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
        connectedAccounts?.trelloUsername ||
        connectedAccounts?.telegramUsername
      const body: Record<string, string | null> = {}
      const g = connectForm.githubUsername.trim()
      const t = connectForm.trelloUsername.trim()
      const tg = connectForm.telegramUsername.trim()
      body.githubUsername = g || null
      body.trelloUsername = t || null
      body.telegramUsername = tg || null

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

  const formatMoney = (amountMinor: number | null) =>
    amountMinor === null
      ? "-"
      : new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }).format(amountMinor / 100)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="size-8 animate-spin text-[#e78a53]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-5xl p-6 md:p-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Employee Portal</h1>
            <p className="mt-1 text-zinc-400">
              Manage your account, reports, and payments.
            </p>
          </div>
          <div className="flex gap-2">
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
              Connect
            </Button>
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => setShowPasswordForm(true)}
            >
              <Key className="mr-2 size-4" />
              Password
            </Button>
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 size-4" />
              Log out
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
                    Salary: {formatMoney(employee.salaryAmountMinor ?? null)}
                    {employee.salaryDate ? ` • Due ${employee.salaryDate}` : ""}
                  </p>
                )}
                {(employee.salaryScheduleDays && employee.salaryScheduleDays.length > 0) && (
                  <p className="mt-1 text-sm text-zinc-400">
                    Office Days: {employee.salaryScheduleDays.join(", ")}
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
                  {tab.label}
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
              <h3 className="text-lg font-semibold text-white">Change Password</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(false)}>
                <span className="text-zinc-400 hover:text-white">✕</span>
              </Button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-zinc-200">
                  Current password
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
                  New password
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
                  {isSubmitting ? "Updating..." : "Update password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordForm(false)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
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
              <h3 className="text-lg font-semibold text-white">Attendance QR</h3>
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
              <h3 className="text-lg font-semibold text-white">Connected Accounts</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowConnectForm(false)}>
                <span className="text-zinc-400 hover:text-white">✕</span>
              </Button>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connect-github" className="text-zinc-200">
                  GitHub username
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
                  Trello username
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
              <div className="space-y-2">
                <Label htmlFor="connect-telegram" className="text-zinc-200">
                  Telegram username
                </Label>
                <Input
                  id="connect-telegram"
                  placeholder="e.g. serdesiyont (without @)"
                  value={connectForm.telegramUsername}
                  onChange={(e) =>
                    setConnectForm((prev) => ({ ...prev, telegramUsername: e.target.value }))
                  }
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              {connectedAccounts && (connectedAccounts.githubUsername || connectedAccounts.trelloUsername || connectedAccounts.telegramUsername) && (
                <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                  Updating your connected accounts will reset your existing report progress. Your previous stats will be lost.
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
                  {connectSubmitting ? "Saving..." : connectedAccounts && (connectedAccounts.githubUsername || connectedAccounts.trelloUsername || connectedAccounts.telegramUsername) ? "Update" : "Connect"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConnectForm(false)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
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
              <h3 className="text-lg font-semibold text-white">Edit Photo</h3>
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
                  {photoPreview && photoPreview !== employee?.photo ? "Change photo" : "Upload photo"}
                </Label>
                <Input
                  id="profile-photo"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <p className="text-xs text-zinc-500">PNG, JPG, GIF, or WEBP (max 5 MB)</p>
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
                  {photoSubmitting ? "Uploading..." : "Upload photo"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPhotoForm(false)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
