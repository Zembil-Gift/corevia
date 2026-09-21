/**
 * Client helpers for the manager's GitHub connection. Talks to the internal proxy at
 * /api/manager/github/connection (which forwards to the backend with the manager cookie).
 */

export interface GitHubOrg {
  login: string
  name: string
  /** Sub-organizations this org credits; empty = all. Absent in the available list. */
  subOrganizationIds?: number[] | null
}

export interface GitHubConnection {
  connected: boolean
  selectedOrgs: GitHubOrg[]
  /** Vice managers only: their branch, which everything they track credits. */
  subOrganizationId?: number | null
  subOrganizationName?: string | null
  /** True for vice managers: always their own branch. */
  subOrganizationLocked?: boolean
}

async function readError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({}))
  return (data as { error?: string; message?: string }).error ?? (data as { message?: string }).message ?? fallback
}

const BASE = "/api/manager/github/connection"

export async function fetchGitHubConnection(): Promise<GitHubConnection> {
  const res = await fetch(BASE, { cache: "no-store" })
  if (!res.ok) throw new Error(await readError(res, "Failed to load GitHub connection"))
  return res.json() as Promise<GitHubConnection>
}

export async function connectGitHub(code: string): Promise<GitHubConnection> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) throw new Error(await readError(res, "Failed to connect GitHub"))
  return res.json() as Promise<GitHubConnection>
}

export async function disconnectGitHub(): Promise<void> {
  const res = await fetch(BASE, { method: "DELETE" })
  if (!res.ok) throw new Error(await readError(res, "Failed to disconnect GitHub"))
}

export async function fetchAvailableOrgs(): Promise<GitHubOrg[]> {
  const res = await fetch(`${BASE}/available-orgs`, { cache: "no-store" })
  if (!res.ok) throw new Error(await readError(res, "Failed to load GitHub orgs"))
  return res.json() as Promise<GitHubOrg[]>
}

export async function saveGitHubOrgs(orgs: GitHubOrg[]): Promise<GitHubConnection> {
  const res = await fetch(`${BASE}/orgs`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orgs }),
  })
  if (!res.ok) throw new Error(await readError(res, "Failed to save orgs"))
  return res.json() as Promise<GitHubConnection>
}

/**
 * Builds GitHub's OAuth authorize URL. GitHub returns an authorization code in the query
 * string (?code=...&state=...) — the backend exchanges it for a token. `state` guards
 * against CSRF; the Integrations page stores it and verifies it on return.
 */
export function githubAuthorizeUrl(returnUrl: string, state: string): string {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
  const params = new URLSearchParams({
    client_id: clientId ?? "",
    redirect_uri: returnUrl,
    scope: "read:org,repo",
    state,
  })
  return `https://github.com/login/oauth/authorize?${params.toString()}`
}
