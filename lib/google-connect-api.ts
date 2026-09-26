export type GoogleConnection = {
  /** False when the server has no GOOGLE_CLIENT_ID/SECRET. */
  configured: boolean
  connected: boolean
  email: string | null
  calendar: boolean
  sheets: boolean
}

export type GoogleFeature = "calendar" | "sheets"

const SCOPES: Record<GoogleFeature, string> = {
  calendar: "https://www.googleapis.com/auth/calendar.events",
  sheets: "https://www.googleapis.com/auth/drive.file",
}

const BASE = "/api/manager/google/connection"
export const GOOGLE_STATE_KEY = "google_oauth_state"
/** Google returns here (not /manager/integrations) so the GitHub card never sees Google's ?code. */
export const googleRedirectUri = () => `${window.location.origin}/manager/integrations/google`

async function request<T>(init?: RequestInit): Promise<T> {
  const res = await fetch(BASE, { cache: "no-store", ...init })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Google request failed")
  return data as T
}

export const fetchGoogleConnection = () => request<GoogleConnection>()

export const connectGoogle = (code: string) =>
  request<GoogleConnection>({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri: googleRedirectUri() }),
  })

export const disconnectGoogle = () => request<void>({ method: "DELETE" })

/**
 * Sends the manager to Google's consent screen for the given features. include_granted_scopes
 * keeps what they already granted, and prompt=consent makes Google return a refresh token.
 */
export function startGoogleConnect(features: GoogleFeature[]) {
  const state = crypto.randomUUID()
  sessionStorage.setItem(GOOGLE_STATE_KEY, state)
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: ["openid", "email", ...features.map((f) => SCOPES[f])].join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}
