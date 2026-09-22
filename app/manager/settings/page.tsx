"use client"

import type React from "react"
import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLang, pick } from "@/lib/i18n"

const c = {
  title: { en: "Settings", am: "ቅንብሮች" },
  passwordTitle: { en: "Change password", am: "የይለፍ ቃል ቀይር" },
  passwordDesc: {
    en: "To confirm it's you, we'll email a 6-digit code to your sign-in address.",
    am: "እርስዎ መሆንዎን ለማረጋገጥ ባለ 6 አሃዝ ኮድ ወደ መግቢያ ኢሜይልዎ እንልካለን።",
  },
  sendCode: { en: "Send verification code", am: "የማረጋገጫ ኮድ ላክ" },
  codeSent: { en: "Code sent. Check your inbox.", am: "ኮድ ተልኳል። የመልዕክት ሳጥንዎን ይመልከቱ።" },
  code: { en: "Verification code", am: "የማረጋገጫ ኮድ" },
  newPassword: { en: "New password", am: "አዲስ የይለፍ ቃል" },
  confirmPassword: { en: "Confirm new password", am: "አዲሱን የይለፍ ቃል ያረጋግጡ" },
  minLength: { en: "At least 8 characters.", am: "ቢያንስ 8 ቁምፊዎች።" },
  mismatch: { en: "Passwords do not match", am: "የይለፍ ቃሎቹ አይዛመዱም" },
  save: { en: "Change password", am: "የይለፍ ቃል ቀይር" },
  resend: { en: "Resend code", am: "ኮዱን እንደገና ላክ" },
  cancel: { en: "Cancel", am: "ተወው" },
  done: { en: "Your password has been changed.", am: "የይለፍ ቃልዎ ተቀይሯል።" },
  wrong: { en: "Something went wrong. Please try again.", am: "የሆነ ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።" },
}

async function errorOf(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({}))
  return (data as { error?: string }).error || fallback
}

export default function ManagerSettingsPage() {
  const { lang } = useLang()
  const [codeSent, setCodeSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const reset = () => {
    setCodeSent(false)
    setOtp("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
  }

  const sendCode = async () => {
    setError("")
    setNotice("")
    setBusy(true)
    try {
      const res = await fetch("/api/admin/settings/password/otp", { method: "POST" })
      if (!res.ok) throw new Error(await errorOf(res, pick(lang, c.wrong)))
      setCodeSent(true)
      setNotice(pick(lang, c.codeSent))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (newPassword !== confirmPassword) {
      setError(pick(lang, c.mismatch))
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/admin/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, newPassword }),
      })
      if (!res.ok) throw new Error(await errorOf(res, pick(lang, c.wrong)))
      reset()
      setNotice(pick(lang, c.done))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <h1 className="mb-8 text-2xl font-bold text-white">{pick(lang, c.title)}</h1>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">{pick(lang, c.passwordTitle)}</h2>
        <p className="mt-1 text-sm text-zinc-400">{pick(lang, c.passwordDesc)}</p>

        {notice && (
          <p className="mt-4 flex items-center gap-2 text-sm text-emerald-400" role="status">
            <CheckCircle2 className="size-4" /> {notice}
          </p>
        )}

        {!codeSent ? (
          <Button
            type="button"
            onClick={sendCode}
            disabled={busy}
            className="mt-5 bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
          >
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            {pick(lang, c.sendCode)}
          </Button>
        ) : (
          <form onSubmit={changePassword} className="mt-5 max-w-sm space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-zinc-200">{pick(lang, c.code)}</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                className="border-zinc-700 bg-zinc-800 tracking-[0.4em] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-zinc-200">{pick(lang, c.newPassword)}</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="border-zinc-700 bg-zinc-800 text-white"
              />
              <p className="text-xs text-zinc-500">{pick(lang, c.minLength)}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-zinc-200">{pick(lang, c.confirmPassword)}</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
              >
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                {pick(lang, c.save)}
              </Button>
              <button
                type="button"
                onClick={sendCode}
                disabled={busy}
                className="text-sm font-medium text-[#e78a53] hover:underline disabled:opacity-50"
              >
                {pick(lang, c.resend)}
              </button>
              <button
                type="button"
                onClick={() => { reset(); setNotice("") }}
                className="text-sm font-medium text-zinc-400 hover:text-zinc-200"
              >
                {pick(lang, c.cancel)}
              </button>
            </div>
          </form>
        )}

        {!codeSent && error && (
          <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  )
}
