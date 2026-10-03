"use client"

import { OAuthCallback } from "@/components/admin/oauth-callback"
import { connectGoogle, GOOGLE_STATE_KEY } from "@/lib/google-connect-api"

export default function GoogleCallbackPage() {
  return <OAuthCallback provider="Google" stateKey={GOOGLE_STATE_KEY} connect={connectGoogle} />
}
