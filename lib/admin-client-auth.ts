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
