"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

type Props = {
  provider: string
  stateKey: string
  connect: (code: string) => Promise<unknown>
}

/** OAuth return page: verifies state, hands the code to the API, then goes back to Integrations. */
export function OAuthCallback({ provider, stateKey, connect }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    // The code is single-use; don't let a dev-mode double effect spend it twice.
    if (started.current) return
    started.current = true
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const state = params.get("state")
    const expected = sessionStorage.getItem(stateKey)
    sessionStorage.removeItem(stateKey)
    history.replaceState(null, "", window.location.pathname)

    if (params.get("error")) {
      setError(params.get("error") === "access_denied" ? `${provider} access was not granted.` : `${provider} returned: ${params.get("error")}`)
      return
    }
    if (!code || !expected || state !== expected) {
      setError(`${provider} sign-in could not be verified. Please try again.`)
      return
    }
    connect(code)
      .then(() => router.replace("/manager/integrations"))
      .catch((e: Error) => setError(e.message))
  }, [router, provider, stateKey, connect])

  return (
    <div className="mx-auto max-w-md py-24 text-center">
      {error ? (
        <>
          <p className="text-sm text-red-400">{error}</p>
          <a href="/manager/integrations" className="mt-4 inline-block text-sm text-primary underline">
            Back to Integrations
          </a>
        </>
      ) : (
        <p className="flex items-center justify-center gap-2 text-sm text-zinc-400">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Connecting {provider}…
        </p>
      )}
    </div>
  )
}
