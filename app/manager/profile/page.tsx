"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Loader2, Upload, ExternalLink, CheckCircle2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  fetchOrgProfile,
  saveOrgProfile,
  uploadOrgImage,
  type OrgProfile,
  type OrgProfileInput,
} from "@/lib/org-profile-api"

const EMPTY: OrgProfileInput = {
  name: "",
  tagline: null,
  description: null,
  logoUrl: null,
  coverImageUrl: null,
  businessType: null,
  industry: null,
  companySize: null,
  foundedYear: null,
  phone: null,
  companyEmail: null,
  websiteUrl: null,
  addressLine: null,
  city: null,
  country: null,
  linkedinUrl: null,
  twitterUrl: null,
  facebookUrl: null,
  instagramUrl: null,
}

const BUSINESS_TYPES = [
  "Sole proprietorship",
  "Partnership",
  "LLC",
  "Corporation",
  "Non-profit",
  "Government",
  "Other",
]
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]

function toInput(p: OrgProfile): OrgProfileInput {
  const { id, slug, status, plan, createdAt, ...rest } = p
  void id
  void slug
  void status
  void plan
  void createdAt
  return rest
}

export default function CompanyProfilePage() {
  const [form, setForm] = useState<OrgProfileInput>(EMPTY)
  const [slug, setSlug] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null)
  const logoInput = useRef<HTMLInputElement>(null)
  const coverInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const p = await fetchOrgProfile()
      setSlug(p.slug)
      setForm(toInput(p))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const set =
    (key: keyof OrgProfileInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const raw = e.target.value
      setSaved(false)
      setForm((prev) => ({
        ...prev,
        [key]: key === "foundedYear" ? (raw ? Number(raw) : null) : raw === "" ? null : raw,
      }))
    }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const updated = await saveOrgProfile(form)
      setForm(toInput(updated))
      setSaved(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (target: "logo" | "cover", file: File | undefined) => {
    if (!file) return
    setUploading(target)
    setError(null)
    try {
      const updated = await uploadOrgImage(target, file)
      setForm((prev) => ({
        ...prev,
        logoUrl: updated.logoUrl,
        coverImageUrl: updated.coverImageUrl,
      }))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-zinc-400">
        <Loader2 className="mr-2 size-5 animate-spin" /> Loading company profile…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Company profile</h1>
          
        </div>
        {slug && (
          <Link
            href={`/o/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            View public page <ExternalLink className="size-4" />
          </Link>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Branding */}
        <Section title="Branding">
          <div className="grid gap-6 sm:grid-cols-2">
            <ImageField
              label="Logo"
              value={form.logoUrl}
              onUrl={set("logoUrl")}
              onPick={() => logoInput.current?.click()}
              uploading={uploading === "logo"}
              rounded
            />
            <ImageField
              label="Cover image"
              value={form.coverImageUrl}
              onUrl={set("coverImageUrl")}
              onPick={() => coverInput.current?.click()}
              uploading={uploading === "cover"}
            />
          </div>
          <input
            ref={logoInput}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => handleUpload("logo", e.target.files?.[0])}
          />
          <input
            ref={coverInput}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => handleUpload("cover", e.target.files?.[0])}
          />
        </Section>

        {/* Basics */}
        <Section title="About the company">
          <Field label="Company name" required>
            <Input value={form.name} onChange={set("name")} required placeholder="Acme Inc." />
          </Field>
          <Field label="Tagline" hint="A short one-liner shown under your name.">
            <Input value={form.tagline ?? ""} onChange={set("tagline")} placeholder="Payments infrastructure for Africa" />
          </Field>
          <Field label="Description" hint="Tell people who you are and what you do.">
            <textarea
              value={form.description ?? ""}
              onChange={set("description")}
              rows={5}
              placeholder="We build…"
              className="flex w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#e78a53]"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Business type">
              <Select value={form.businessType ?? ""} onChange={set("businessType")} options={BUSINESS_TYPES} placeholder="Select type" />
            </Field>
            <Field label="Industry">
              <Input value={form.industry ?? ""} onChange={set("industry")} placeholder="Fintech, Retail…" />
            </Field>
            <Field label="Company size">
              <Select value={form.companySize ?? ""} onChange={set("companySize")} options={COMPANY_SIZES} placeholder="Headcount" />
            </Field>
            <Field label="Founded year">
              <Input
                type="number"
                min={1800}
                max={2100}
                value={form.foundedYear ?? ""}
                onChange={set("foundedYear")}
                placeholder="2018"
              />
            </Field>
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Phone number">
              <Input value={form.phone ?? ""} onChange={set("phone")} placeholder="+251 …" />
            </Field>
            <Field label="Company email">
              <Input type="email" value={form.companyEmail ?? ""} onChange={set("companyEmail")} placeholder="hello@company.com" />
            </Field>
            <Field label="Website">
              <Input value={form.websiteUrl ?? ""} onChange={set("websiteUrl")} placeholder="https://company.com" />
            </Field>
          </div>
        </Section>

        {/* Location */}
        <Section title="Location">
          <Field label="Address">
            <Input value={form.addressLine ?? ""} onChange={set("addressLine")} placeholder="123 Bole Rd" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City">
              <Input value={form.city ?? ""} onChange={set("city")} placeholder="Addis Ababa" />
            </Field>
            <Field label="Country">
              <Input value={form.country ?? ""} onChange={set("country")} placeholder="Ethiopia" />
            </Field>
          </div>
        </Section>

        {/* Socials */}
        <Section title="Social links">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="LinkedIn">
              <Input value={form.linkedinUrl ?? ""} onChange={set("linkedinUrl")} placeholder="https://linkedin.com/company/…" />
            </Field>
            <Field label="X / Twitter">
              <Input value={form.twitterUrl ?? ""} onChange={set("twitterUrl")} placeholder="https://x.com/…" />
            </Field>
            <Field label="Facebook">
              <Input value={form.facebookUrl ?? ""} onChange={set("facebookUrl")} placeholder="https://facebook.com/…" />
            </Field>
            <Field label="Instagram">
              <Input value={form.instagramUrl ?? ""} onChange={set("instagramUrl")} placeholder="https://instagram.com/…" />
            </Field>
          </div>
        </Section>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}

        <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-zinc-800 bg-zinc-950/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
              <CheckCircle2 className="size-4" /> Saved
            </span>
          )}
          <Button
            type="submit"
            disabled={saving || uploading !== null}
            className="bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-zinc-200">
        {label}
        {required && <span className="text-[#e78a53]"> *</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: string[]
  placeholder: string
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#e78a53]"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

function ImageField({
  label,
  value,
  onUrl,
  onPick,
  uploading,
  rounded,
}: {
  label: string
  value: string | null
  onUrl: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPick: () => void
  uploading: boolean
  rounded?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label className="text-zinc-200">{label}</Label>
      <div className="flex items-center gap-4">
        <div
          className={`grid size-16 shrink-0 place-items-center overflow-hidden border border-zinc-700 bg-zinc-800 ${
            rounded ? "rounded-full" : "rounded-lg"
          }`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="size-5 text-zinc-500" />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onPick}
          disabled={uploading}
          className="border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" /> Upload
            </>
          )}
        </Button>
      </div>
      <Input value={value ?? ""} onChange={onUrl} placeholder="…or paste an image URL" />
    </div>
  )
}
