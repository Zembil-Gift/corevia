"use client"

import { useEffect, useRef, useState, useId } from "react"
import { X, Camera, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Html5Qrcode } from "html5-qrcode"

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerId = useId()

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const startScanning = async () => {
    setError(null)
    setLoading(true)

    try {
      const elementId = `qr-scanner-${scannerId.replace(/:/g, "")}`
      let container = document.getElementById(elementId)

      if (!container) {
        container = document.createElement("div")
        container.id = elementId
        container.style.width = "100%"
        container.style.height = "100%"

        const wrapper = document.getElementById("qr-wrapper")
        if (wrapper) {
          wrapper.innerHTML = ""
          wrapper.appendChild(container)
        }
      }

      const html5QrCode = new Html5Qrcode(elementId)
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          html5QrCode
            .stop()
            .then(() => {
              setScanning(false)
              scannerRef.current = null
              onScan(decodedText)
            })
            .catch(() => {
              setScanning(false)
              scannerRef.current = null
            })
        },
        () => {},
      )

      setScanning(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start scanner")
      setScanning(false)
    } finally {
      setLoading(false)
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
      } catch {
        // Ignore errors when stopping
      }
      scannerRef.current = null
    }
    setScanning(false)
  }

  const handleClose = async () => {
    await stopScanning()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-zinc-900 p-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="font-semibold text-white">Scan QR Code</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="size-5" />
          </Button>
        </div>

        <div className="mt-4 aspect-square overflow-hidden rounded-lg bg-zinc-800">
          <div id="qr-wrapper" className="h-full w-full" />
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          {!scanning ? (
            <Button
              onClick={startScanning}
              disabled={loading}
              className="flex-1 bg-[#e78a53] text-white hover:bg-[#e78a53]/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Camera className="mr-2 size-4" />
                  Start Scanning
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-300"
            >
              Stop
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}