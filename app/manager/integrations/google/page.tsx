"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { connectGoogle, GOOGLE_STATE_KEY } from "@/lib/google-connect-api"

/** OAuth return page: verifies state, hands the code to the API, then goes back to Integrations. */
export default function GoogleCallbackPage() {
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
    const expected = sessionStorage.getItem(GOOGLE_STATE_KEY)
    sessionStorage.removeItem(GOOGLE_STATE_KEY)
    history.replaceState(null, "", window.location.pathname)

    if (params.get("error")) {
      setError(params.get("error") === "access_denied" ? "Google access was not granted." : `Google returned: ${params.get("error")}`)
      return
    }
    if (!code || !expected || state !== expected) {
      setError("Google sign-in could not be verified. Please try again.")
      return
    }
    connectGoogle(code)
      .then(() => router.replace("/manager/integrations"))
      .catch((e: Error) => setError(e.message))
  }, [router])

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
          <Loader2 className="size-4 animate-spin" aria-hidden /> Connecting Google…
        </p>
      )}
    </div>
  )
}
