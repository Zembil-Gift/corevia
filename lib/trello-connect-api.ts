/**
 * Client helpers for the manager's Trello connection. Talks to the internal proxy at
 * /api/manager/trello/connection (which forwards to the backend with the manager cookie).
 */

export interface TrelloBoard {
  id: string
  name: string
}

export interface TrelloConnection {
  connected: boolean
  selectedBoards: TrelloBoard[]
}

async function readError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}))
  return (data as { error?: string; message?: string }).error ?? (data as { message?: string }).message ?? fallback
}

const BASE = "/api/manager/trello/connection"

export async function fetchTrelloConnection(): Promise<TrelloConnection> {
  const res = await fetch(BASE, { cache: "no-store" })
  if (!res.ok) throw new Error(await readError(res, "Failed to load Trello connection"))
  return res.json() as Promise<TrelloConnection>
}

export async function connectTrello(token: string): Promise<TrelloConnection> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  })
  if (!res.ok) throw new Error(await readError(res, "Failed to connect Trello"))
  return res.json() as Promise<TrelloConnection>
}

export async function disconnectTrello(): Promise<void> {
  const res = await fetch(BASE, { method: "DELETE" })
  if (!res.ok) throw new Error(await readError(res, "Failed to disconnect Trello"))
}

export async function fetchAvailableBoards(): Promise<TrelloBoard[]> {
  const res = await fetch(`${BASE}/available-boards`, { cache: "no-store" })
  if (!res.ok) throw new Error(await readError(res, "Failed to load Trello boards"))
  return res.json() as Promise<TrelloBoard[]>
}

export async function saveTrelloBoards(boards: TrelloBoard[]): Promise<TrelloConnection> {
  const res = await fetch(`${BASE}/boards`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ boards }),
  })
  if (!res.ok) throw new Error(await readError(res, "Failed to save boards"))
  return res.json() as Promise<TrelloConnection>
}

/**
 * Builds Trello's authorize URL. Trello returns the token in the URL fragment
 * (#token=...), which only client JS can read — the Integrations page grabs it on load.
 */
export function trelloAuthorizeUrl(returnUrl: string): string {
  const key = process.env.NEXT_PUBLIC_TRELLO_KEY
  const params = new URLSearchParams({
    key: key ?? "",
    scope: "read",
    expiration: "never",
    name: "AfroDebab CMS",
    response_type: "token",
    return_url: returnUrl,
  })
  return `https://trello.com/1/authorize?${params.toString()}`
}
