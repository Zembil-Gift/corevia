"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, CheckCircle2, Link2, Unlink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BranchTicks, LockedBranchNote, useBranches } from "@/components/admin/connection-branch-picker"
import {
  fetchGitHubConnection,
  connectGitHub,
  disconnectGitHub,
  fetchAvailableOrgs,
  saveGitHubOrgs,
  githubAuthorizeUrl,
  type GitHubOrg,
  type GitHubConnection,
} from "@/lib/github-connect-api"

const STATE_KEY = "github_oauth_state"

export function GitHubIntegration() {
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [selected, setSelected] = useState<GitHubOrg[]>([])
  const [available, setAvailable] = useState<GitHubOrg[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [branchLocked, setBranchLocked] = useState(false)
  const [branchName, setBranchName] = useState<string | null>(null)

  const applyConnection = (conn: GitHubConnection) => {
    setConnected(conn.connected)
    setAccount(conn.account ?? null)
    setSelected(conn.selectedOrgs)
    setBranchName(conn.subOrganizationName ?? null)
    setBranchLocked(Boolean(conn.subOrganizationLocked))
  }

  const load = useCallback(async () => {
    try {
      const conn = await fetchGitHubConnection()
      applyConnection(conn)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  // On return from GitHub, the code arrives in the query string (?code=...&state=...).
  const captureCodeFromQuery = useCallback(async () => {
    if (typeof window === "undefined") return false
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const state = params.get("state")
    if (!code) return false
    // Clear the code from the address bar immediately.
    history.replaceState(null, "", window.location.pathname)
    // CSRF guard: the state must match what we stored before redirecting.
    const expected = sessionStorage.getItem(STATE_KEY)
    sessionStorage.removeItem(STATE_KEY)
    if (!expected || state !== expected) {
      setError("GitHub sign-in could not be verified (state mismatch). Please try again.")
      return false
    }
    setBusy(true)
    try {
      const conn = await connectGitHub(code)
      applyConnection(conn)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect GitHub")
    } finally {
      setBusy(false)
    }
    return true
  }, [])

  useEffect(() => {
    ;(async () => {
      const captured = await captureCodeFromQuery()
      if (!captured) await load()
      else setLoading(false)
    })()
  }, [captureCodeFromQuery, load])

  const handleConnect = () => {
    const state = crypto.randomUUID()
    sessionStorage.setItem(STATE_KEY, state)
    window.location.href = githubAuthorizeUrl(window.location.origin + "/manager/integrations", state)
  }

  const handleDisconnect = async () => {
    setBusy(true)
    setError(null)
    try {
      await disconnectGitHub()
      setConnected(false)
      setSelected([])
      setAvailable(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disconnect")
    } finally {
      setBusy(false)
    }
  }

  const loadOrgs = async () => {
    setBusy(true)
    setError(null)
    try {
      setAvailable(await fetchAvailableOrgs())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orgs")
    } finally {
      setBusy(false)
    }
  }

  const branches = useBranches(connected && !branchLocked)
  const isSelected = (login: string) => selected.some((o) => o.login === login)
  const branchesOf = (login: string) => selected.find((o) => o.login === login)?.subOrganizationIds ?? []
  const toggle = (org: GitHubOrg) => {
    setSaved(false)
    setSelected((prev) =>
      prev.some((o) => o.login === org.login)
        ? prev.filter((o) => o.login !== org.login)
        : [...prev, { ...org, subOrganizationIds: [] }]
    )
  }
  const setBranchesOf = (login: string, subOrganizationIds: number[]) => {
    setSaved(false)
    setSelected((prev) => prev.map((o) => (o.login === login ? { ...o, subOrganizationIds } : o)))
  }

  const handleSave = async () => {
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const conn = await saveGitHubOrgs(selected)
      applyConnection(conn)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setBusy(false)
    }
  }

  const orgsToShow = available ?? selected

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-medium text-zinc-100">
            GitHub
            {connected && <CheckCircle2 className="size-4 text-emerald-400" />}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {loading ? "Loading…" : connected ? (account ? `Connected as ${account}.` : "Your GitHub account is connected.") : "Not connected."}
          </p>
          {!loading && !connected && (
            <p className="mt-1 text-xs text-zinc-500">
              After connecting, pick the organizations to track
              {branchLocked ? "." : " and tick which sub-organizations each one covers."}
            </p>
          )}
        </div>
        {!loading &&
          (connected ? (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={busy}
              className="border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            >
              <Unlink className="mr-2 size-4" /> Disconnect
            </Button>
          ) : (
            <Button onClick={handleConnect} disabled={busy} className="bg-[#e78a53] text-white hover:bg-[#d67a43]">
              <Link2 className="mr-2 size-4" /> Connect GitHub
            </Button>
          ))}
      </div>

      {connected && (
        <div className="mt-6 border-t border-zinc-800 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-200">Tracked organizations</h3>
            <button
              onClick={loadOrgs}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} />
              {available ? "Refresh" : "Load my orgs"}
            </button>
          </div>

          {orgsToShow.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              {available ? (
                <>
                  No organizations visible. Orgs that restrict third-party apps stay hidden until access is
                  granted —{" "}
                  <a
                    href={`https://github.com/settings/connections/applications/${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 underline"
                  >
                    grant or request org access on GitHub
                  </a>
                  , then reload.
                </>
              ) : (
                "Load your orgs to pick which to track."
              )}
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {orgsToShow.map((org) => (
                <li key={org.login}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 hover:border-zinc-700">
                    <input
                      type="checkbox"
                      checked={isSelected(org.login)}
                      onChange={() => toggle(org)}
                      className="size-4 accent-[#e78a53]"
                    />
                    <span className="truncate">{org.name || org.login}</span>
                  </label>
                  {!branchLocked && isSelected(org.login) && (
                    <BranchTicks
                      label={org.name || org.login}
                      branches={branches}
                      value={branchesOf(org.login)}
                      onChange={(ids) => setBranchesOf(org.login, ids)}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}

          {branchLocked && <LockedBranchNote name={branchName} />}

          <div className="mt-5 flex items-center gap-3">
            <Button onClick={handleSave} disabled={busy} className="bg-[#e78a53] text-white hover:bg-[#d67a43]">
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save tracked organizations
            </Button>
            {saved && <span className="text-sm text-emerald-400">Saved.</span>}
          </div>
        </div>
      )}
    </section>
  )
}
