const ADMIN_TOKEN_STORAGE_KEY = "admin_token"

export function getCmsBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_CMS_BASE_URL
  if (!baseUrl) {
    throw new Error("CMS base URL is not configured")
  }
  return baseUrl.replace(/\/$/, "")
}

export function setAdminClientToken(token: string) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token)
}

export function getAdminClientToken(): string | null {
  if (typeof window === "undefined") return null
  return window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
}

export function clearAdminClientToken() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
}

export function getClientRole(): "MANAGER" | "VICE_MANAGER" | "EMPLOYEE" | "ADMIN" | null {
  const token = getAdminClientToken()
  if (!token) return null
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const json = decodeURIComponent(escape(atob(base64)))
    const payload = JSON.parse(json)
    return payload.role ?? "MANAGER"
  } catch {
    return null
  }
}

export function isViceManagerClient(): boolean {
  return getClientRole() === "VICE_MANAGER"
}

