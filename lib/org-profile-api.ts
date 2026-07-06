/**
 * Client-side helpers for the manager "Company Profile" editor. Talks to the internal
 * proxy at /api/admin/org (which forwards to the backend /manager/org with the manager
 * session cookie). The org is resolved server-side from the token's tenant.
 */

export interface OrgProfile {
  id: number
  name: string
  slug: string
  status: string
  plan: string
  tagline: string | null
  description: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  businessType: string | null
  industry: string | null
  companySize: string | null
  foundedYear: number | null
  phone: string | null
  companyEmail: string | null
  websiteUrl: string | null
  addressLine: string | null
  city: string | null
  country: string | null
  linkedinUrl: string | null
  twitterUrl: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  createdAt: string
}

export type OrgProfileInput = Omit<OrgProfile, "id" | "slug" | "status" | "plan" | "createdAt">

async function readError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}))
  return (data as { error?: string; message?: string }).error ?? (data as { message?: string }).message ?? fallback
}

export async function fetchOrgProfile(): Promise<OrgProfile> {
  const res = await fetch("/api/admin/org", { cache: "no-store" })
  if (!res.ok) throw new Error(await readError(res, "Failed to load company profile"))
  return res.json() as Promise<OrgProfile>
}

export async function saveOrgProfile(input: OrgProfileInput): Promise<OrgProfile> {
  const res = await fetch("/api/admin/org", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readError(res, "Failed to save company profile"))
  return res.json() as Promise<OrgProfile>
}

/** Upload a logo or cover image; returns the updated profile with the stored URL. */
export async function uploadOrgImage(target: "logo" | "cover", file: File): Promise<OrgProfile> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch(`/api/admin/org/${target}`, { method: "POST", body: fd })
  if (!res.ok) throw new Error(await readError(res, "Failed to upload image"))
  return res.json() as Promise<OrgProfile>
}
