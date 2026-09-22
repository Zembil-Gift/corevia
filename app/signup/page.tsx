"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/corevia/logo"
import { LangToggle } from "@/components/corevia/lang-toggle"
import { useLang, pick } from "@/lib/i18n"

const copy = {
  back: { en: "Back to home", am: "ወደ መነሻ ተመለስ" },
  title: { en: "Start for free", am: "በነጻ ይጀምሩ" },
  received: { en: "Request received", am: "ጥያቄው ደርሷል" },
  thanks: { en: "Thanks", am: "አመሰግናለሁ" },
  there: { en: "there", am: "እናንተ" },
  receivedBody1: { en: "We've received your request to create the", am: "የሚከተለውን የስራ ቦታ ለመፍጠር ጥያቄዎን ተቀብለናል፦" },
  yourCompany: { en: "your company", am: "የእርስዎ ኩባንያ" },
  workspaceWord: { en: "workspace.", am: "።" },
  receivedBody2: { en: "Our team will review it and email", am: "ቡድናችን ይገመግመዋል እና ከጸደቀ በኋላ የመግቢያ መረጃዎን ወደ" },
  receivedBody3: { en: "with your login credentials once it's approved.", am: "ኢሜይል ያደርጋል።" },
  goSignIn: { en: "Go to sign in", am: "ወደ መግቢያ ይሂዱ" },
  companyName: { en: "Company name", am: "የኩባንያ ስም" },
  yourName: { en: "Your name", am: "የእርስዎ ስም" },
  workEmail: { en: "Work email", am: "የስራ ኢሜይል" },
  phone: { en: "Phone", am: "ስልክ" },
  industry: { en: "Industry", am: "ዘርፍ" },
  industryPlaceholder: { en: "e.g. Retail, Healthcare, Fintech", am: "ለምሳሌ ችርቻሮ፣ ጤና፣ ፊንቴክ" },
  website: { en: "Website", am: "ድህረ ገጽ" },
  agree: { en: "I agree to the", am: "እስማማለሁ ከ" },
  terms: { en: "Terms of Service", am: "የአገልግሎት ውል" },
  and: { en: "and", am: "እና" },
  privacy: { en: "Privacy Policy", am: "የግላዊነት ፖሊሲ" },
  sending: { en: "Sending request...", am: "ጥያቄ በመላክ ላይ..." },
  requestWorkspace: { en: "Request your workspace", am: "የስራ ቦታዎን ይጠይቁ" },
  haveAccount: { en: "Already have an account?", am: "አስቀድሞ መለያ አለዎት?" },
  signIn: { en: "Sign in", am: "ግባ" },
  wrong: { en: "Something went wrong. Please try again.", am: "የሆነ ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።" },
  sendingCode: { en: "Sending code...", am: "ኮድ በመላክ ላይ..." },
  continue: { en: "Continue", am: "ቀጥል" },
  verifyTitle: { en: "Verify your email", am: "ኢሜይልዎን ያረጋግጡ" },
  codeSentTo: { en: "We sent a 6-digit code to", am: "ባለ 6 አሃዝ ኮድ ልከናል ወደ" },
  code: { en: "Verification code", am: "የማረጋገጫ ኮድ" },
  resend: { en: "Resend code", am: "ኮዱን እንደገና ላክ" },
  editDetails: { en: "Edit details", am: "ዝርዝሮችን አርትዕ" },
}

export default function SignupPage() {
  const { lang } = useLang()
  const [formData, setFormData] = useState({
    company: "",
    name: "",
    email: "",
    phone: "",
    industry: "",
    website: "",
    message: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [otp, setOtp] = useState("")

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const sendCode = async () => {
    setError("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/signup/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || pick(lang, copy.wrong))
      }
      setCodeSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeSent) return sendCode()
    setError("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.company.trim(),
          contactName: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          industry: formData.industry.trim() || undefined,
          websiteUrl: formData.website.trim() || undefined,
          message: formData.message.trim() || undefined,
          otp: otp.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || pick(lang, copy.wrong))
      }
      setSubmitted(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 40% at 50% 0%, rgba(16,185,129,0.15), transparent 60%), radial-gradient(40% 40% at 10% 100%, rgba(163,230,53,0.08), transparent 60%)",
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
         
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-8 shadow-xl shadow-slate-900/5"
        >
          {submitted ? (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-xl font-bold text-foreground">{pick(lang, copy.received)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {pick(lang, copy.thanks)}, {formData.name.split(" ")[0] || pick(lang, copy.there)}. {pick(lang, copy.receivedBody1)}{" "}
                <span className="font-semibold text-foreground">{formData.company || pick(lang, copy.yourCompany)}</span>{" "}
                {pick(lang, copy.workspaceWord)} {pick(lang, copy.receivedBody2)}{" "}
                <span className="font-semibold text-foreground">{formData.email}</span> {pick(lang, copy.receivedBody3)}
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
              >
                {pick(lang, copy.goSignIn)}
              </Link>
            </div>
          ) : codeSent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">{pick(lang, copy.verifyTitle)}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {pick(lang, copy.codeSentTo)}{" "}
                  <span className="font-semibold text-foreground">{formData.email}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">
                  {pick(lang, copy.code)} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="otp"
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                  className="text-center text-lg tracking-[0.5em]"
                />
              </div>

              {error && (
                <p
                  className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
              >
                {isLoading ? pick(lang, copy.sending) : pick(lang, copy.requestWorkspace)}
              </Button>

              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setCodeSent(false); setOtp(""); setError("") }}
                  className="font-medium text-muted-foreground hover:text-foreground"
                >
                  {pick(lang, copy.editDetails)}
                </button>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={isLoading}
                  className="font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                >
                  {pick(lang, copy.resend)}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="company">
                  {pick(lang, copy.companyName)} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  placeholder="Acme Inc."
                  value={formData.company}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  {pick(lang, copy.yourName)} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  {pick(lang, copy.workEmail)} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              
                <div className="space-y-2">
                  <Label htmlFor="phone">{pick(lang, copy.phone)}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+251 …"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">{pick(lang, copy.industry)}</Label>
                  <Input
                    id="industry"
                    name="industry"
                    type="text"
                    placeholder={pick(lang, copy.industryPlaceholder)}
                    value={formData.industry}
                    onChange={handleChange}
                  />
                </div>
              

              <div className="space-y-2">
                <Label htmlFor="website">{pick(lang, copy.website)}</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://company.com"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>

             

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 rounded border-input text-emerald-400 focus:ring-emerald-500/30"
                  required
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  {pick(lang, copy.agree)}{" "}
                  <Link href="#" className="font-medium text-emerald-400 hover:text-emerald-300">
                    {pick(lang, copy.terms)}
                  </Link>{" "}
                  {pick(lang, copy.and)}{" "}
                  <Link href="#" className="font-medium text-emerald-400 hover:text-emerald-300">
                    {pick(lang, copy.privacy)}
                  </Link>
                </label>
              </div>

              {error && (
                <p
                  className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
              >
                {isLoading ? pick(lang, copy.sendingCode) : pick(lang, copy.continue)}
              </Button>
            </form>
          )}

          {!submitted && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {pick(lang, copy.haveAccount)}{" "}
                <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
                  {pick(lang, copy.signIn)}
                </Link>
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
