"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, CheckCircle2, Link2, Unlink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BranchTicks, LockedBranchNote, useBranches } from "@/components/admin/connection-branch-picker"
import {
  fetchTrelloConnection,
  connectTrello,
  disconnectTrello,
  fetchAvailableBoards,
  saveTrelloBoards,
  trelloAuthorizeUrl,
  type TrelloBoard,
  type TrelloConnection,
} from "@/lib/trello-connect-api"

export function TrelloIntegration() {
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [selected, setSelected] = useState<TrelloBoard[]>([])
  const [available, setAvailable] = useState<TrelloBoard[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [branchLocked, setBranchLocked] = useState(false)
  const [branchName, setBranchName] = useState<string | null>(null)

  const applyConnection = (conn: TrelloConnection) => {
    setConnected(conn.connected)
    setAccount(conn.account ?? null)
    setSelected(conn.selectedBoards)
    setBranchName(conn.subOrganizationName ?? null)
    setBranchLocked(Boolean(conn.subOrganizationLocked))
  }

  const load = useCallback(async () => {
    try {
      const conn = await fetchTrelloConnection()
      applyConnection(conn)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  // On return from Trello, the token arrives in the URL fragment (#token=...).
  const captureTokenFromHash = useCallback(async () => {
    if (typeof window === "undefined") return false
    const match = window.location.hash.match(/token=([^&]+)/)
    if (!match) return false
    history.replaceState(null, "", window.location.pathname)
    setBusy(true)
    try {
      const conn = await connectTrello(decodeURIComponent(match[1]))
      applyConnection(conn)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect Trello")
    } finally {
      setBusy(false)
    }
    return true
  }, [])

  useEffect(() => {
    ;(async () => {
      const captured = await captureTokenFromHash()
      if (!captured) await load()
      else setLoading(false)
    })()
  }, [captureTokenFromHash, load])

  const handleConnect = () => {
    window.location.href = trelloAuthorizeUrl(window.location.origin + "/manager/integrations")
  }

  const handleDisconnect = async () => {
    setBusy(true)
    setError(null)
    try {
      await disconnectTrello()
      setConnected(false)
      setSelected([])
      setAvailable(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disconnect")
    } finally {
      setBusy(false)
    }
  }

  const loadBoards = async () => {
    setBusy(true)
    setError(null)
    try {
      setAvailable(await fetchAvailableBoards())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load boards")
    } finally {
      setBusy(false)
    }
  }

  const branches = useBranches(connected && !branchLocked)
  const isSelected = (id: string) => selected.some((b) => b.id === id)
  const branchesOf = (id: string) => selected.find((b) => b.id === id)?.subOrganizationIds ?? []
  const toggle = (board: TrelloBoard) => {
    setSaved(false)
    setSelected((prev) =>
      prev.some((b) => b.id === board.id)
        ? prev.filter((b) => b.id !== board.id)
        : [...prev, { ...board, subOrganizationIds: [] }]
    )
  }
  const setBranchesOf = (id: string, subOrganizationIds: number[]) => {
    setSaved(false)
    setSelected((prev) => prev.map((b) => (b.id === id ? { ...b, subOrganizationIds } : b)))
  }

  const handleSave = async () => {
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const conn = await saveTrelloBoards(selected)
      applyConnection(conn)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setBusy(false)
    }
  }

  const boardsToShow = available ?? selected

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
            Trello
            {connected && <CheckCircle2 className="size-4 text-emerald-400" />}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {loading ? "Loading…" : connected ? (account ? `Connected as ${account}.` : "Your Trello account is connected.") : "Not connected."}
          </p>
          {!loading && !connected && (
            <p className="mt-1 text-xs text-zinc-500">
              After connecting, pick the boards to track
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
              <Link2 className="mr-2 size-4" /> Connect Trello
            </Button>
          ))}
      </div>

      {connected && (
        <div className="mt-6 border-t border-zinc-800 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-200">Tracked boards</h3>
            <button
              onClick={loadBoards}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} />
              {available ? "Refresh" : "Load my boards"}
            </button>
          </div>

          {boardsToShow.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              {available ? "No boards found on your Trello account." : "Load your boards to pick which to track."}
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {boardsToShow.map((board) => (
                <li key={board.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 hover:border-zinc-700">
                    <input
                      type="checkbox"
                      checked={isSelected(board.id)}
                      onChange={() => toggle(board)}
                      className="size-4 accent-[#e78a53]"
                    />
                    <span className="truncate">{board.name || board.id}</span>
                  </label>
                  {!branchLocked && isSelected(board.id) && (
                    <BranchTicks
                      label={board.name || board.id}
                      branches={branches}
                      value={branchesOf(board.id)}
                      onChange={(ids) => setBranchesOf(board.id, ids)}
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
              Save tracked boards
            </Button>
            {saved && <span className="text-sm text-emerald-400">Saved.</span>}
          </div>
        </div>
      )}
    </section>
  )
}
