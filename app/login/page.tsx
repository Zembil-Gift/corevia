"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/corevia/logo"
import { LangToggle } from "@/components/corevia/lang-toggle"
import { useLang, pick } from "@/lib/i18n"
import { clearAdminClientToken, setAdminClientToken } from "@/lib/admin-client-auth"

const copy = {
  back: { en: "Back to home", am: "ወደ መነሻ ተመለስ" },
  title: { en: "Welcome back", am: "እንኳን ደህና ተመለሱ" },
  subtitle: { en: "Sign in to your workspace to continue", am: "ለመቀጠል ወደ የስራ ቦታዎ ይግቡ" },
  email: { en: "Email", am: "ኢሜይል" },
  password: { en: "Password", am: "የይለፍ ቃል" },
  passwordPlaceholder: { en: "Enter your password", am: "የይለፍ ቃልዎን ያስገቡ" },
  remember: { en: "Remember me", am: "አስታውሰኝ" },
  forgot: { en: "Forgot password?", am: "የይለፍ ቃል ረሱ?" },
  signingIn: { en: "Signing in...", am: "በመግባት ላይ..." },
  signIn: { en: "Sign in", am: "ግባ" },
  newHere: { en: "New to Corevia?", am: "Corevia አዲስ ነዎት?" },
  startTrial: { en: "Start your free trial", am: "ነጻ ሙከራዎን ይጀምሩ" },
  invalid: { en: "Invalid email or password", am: "የተሳሳተ ኢሜይል ወይም የይለፍ ቃል" },
  wrong: { en: "Something went wrong. Please try again.", am: "የሆነ ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።" },
}

export default function LoginPage() {
  const { lang } = useLang()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || pick(lang, copy.invalid))
        setIsLoading(false)
        return
      }
      const role: "platform" | "admin" | "employee" =
        data.role === "platform" ? "platform" : data.role === "employee" ? "employee" : "admin"
      if (role === "admin" && typeof data.token === "string") {
        setAdminClientToken(data.token)
      } else {
        clearAdminClientToken()
      }
      const prefix = role === "platform" ? "/platform" : role === "employee" ? "/employee" : "/manager"
      const isRoleMatchingCallback = typeof callbackUrl === "string" && callbackUrl.startsWith(prefix)
      // Employees land on their reports page directly instead of hopping through /employee's redirect.
      const home = role === "employee" ? "/employee/reports" : prefix
      window.location.href = isRoleMatchingCallback ? callbackUrl : home
      return
    } catch {
      setError(pick(lang, copy.wrong))
    }
    setIsLoading(false)
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 40% at 50% 0%, rgba(16,185,129,0.15), transparent 60%), radial-gradient(40% 40% at 90% 100%, rgba(163,230,53,0.08), transparent 60%)",
        }}
      />

      <Link
        href="/"
        className="absolute left-6 top-6 z-20 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{pick(lang, copy.back)}</span>
      </Link>

      <div className="absolute right-6 top-6 z-20">
        <LangToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-block">
            <Logo className="[&_span:last-child]:text-xl" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{pick(lang, copy.title)}</h1>
          <p className="mt-2 text-muted-foreground">{pick(lang, copy.subtitle)}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-8 shadow-xl shadow-slate-900/5"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{pick(lang, copy.email)}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{pick(lang, copy.password)}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={pick(lang, copy.passwordPlaceholder)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" className="rounded border-input text-emerald-400 focus:ring-emerald-500/30" />
                <span>{pick(lang, copy.remember)}</span>
              </label>
              <Link href="#" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
                {pick(lang, copy.forgot)}
              </Link>
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              {isLoading ? pick(lang, copy.signingIn) : pick(lang, copy.signIn)}
            </Button>
          </form>
        </motion.div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {pick(lang, copy.newHere)}{" "}
          <Link href="/signup" className="font-semibold text-emerald-400 hover:text-emerald-300">
            {pick(lang, copy.startTrial)}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
