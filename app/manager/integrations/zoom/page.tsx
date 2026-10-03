"use client"

import { OAuthCallback } from "@/components/admin/oauth-callback"
import { connectZoom, ZOOM_STATE_KEY } from "@/lib/zoom-connect-api"

export default function ZoomCallbackPage() {
  return <OAuthCallback provider="Zoom" stateKey={ZOOM_STATE_KEY} connect={connectZoom} />
}
