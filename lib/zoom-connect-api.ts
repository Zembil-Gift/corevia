export type ZoomConnection = {
  /** False when the server has no ZOOM_CLIENT_ID/SECRET. */
  configured: boolean
  connected: boolean
  email: string | null
}

const BASE = "/api/manager/zoom/connection"
export const ZOOM_STATE_KEY = "zoom_oauth_state"
const zoomRedirectUri = () => `${window.location.origin}/manager/integrations/zoom`

async function request<T>(init?: RequestInit): Promise<T> {
  const res = await fetch(BASE, { cache: "no-store", ...init })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Zoom request failed")
  return data as T
}

export const fetchZoomConnection = () => request<ZoomConnection>()

export const connectZoom = (code: string) =>
  request<ZoomConnection>({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri: zoomRedirectUri() }),
  })

export const disconnectZoom = () => request<void>({ method: "DELETE" })

/** Sends the manager to Zoom's consent screen; scopes come from the Zoom app's settings. */
export function startZoomConnect() {
  const state = crypto.randomUUID()
  sessionStorage.setItem(ZOOM_STATE_KEY, state)
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID ?? "",
    redirect_uri: zoomRedirectUri(),
    state,
  })
  window.location.href = `https://zoom.us/oauth/authorize?${params.toString()}`
}
