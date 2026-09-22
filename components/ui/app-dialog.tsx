"use client"

import { useEffect, useState } from "react"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

type DialogOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}

type Request = DialogOptions & { kind: "alert" | "confirm"; resolve: (ok: boolean) => void }

// ponytail: module-level queue so any component (or plain async handler) can await a dialog
// without threading a context through; <DialogHost/> in the root layout renders it.
let queue: Request[] = []
let notify: (() => void) | null = null

function open(kind: Request["kind"], opts: DialogOptions | string) {
  const o = typeof opts === "string" ? { message: opts } : opts
  return new Promise<boolean>((resolve) => {
    queue = [...queue, { ...o, kind, resolve }]
    notify?.()
  })
}

/** Drop-in for window.confirm: resolves true when the user confirms. */
export const confirmDialog = (opts: DialogOptions | string) => open("confirm", opts)

/** Drop-in for window.alert: resolves once dismissed. */
export const alertDialog = (opts: DialogOptions | string) => open("alert", opts).then(() => undefined)

export function DialogHost() {
  const [current, setCurrent] = useState<Request | null>(null)

  useEffect(() => {
    notify = () => setCurrent((c) => c ?? queue[0] ?? null)
    notify()
    return () => {
      notify = null
    }
  }, [])

  const close = (ok: boolean) => {
    // Action/Cancel clicks also fire onOpenChange(false); only settle each request once.
    if (!current || queue[0] !== current) return
    current.resolve(ok)
    queue = queue.slice(1)
    setCurrent(queue[0] ?? null)
  }

  const isConfirm = current?.kind === "confirm"
  const Icon = current?.destructive ? AlertTriangle : Info

  return (
    <AlertDialog.Root open={!!current} onOpenChange={(o) => !o && close(false)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
          <div className="flex items-start gap-3">
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${current?.destructive ? "text-red-400" : "text-[#e78a53]"}`} />
            <div className="space-y-2">
              <AlertDialog.Title className="text-lg font-semibold text-white">
                {current?.title ?? (isConfirm ? "Are you sure?" : "Notice")}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-zinc-400 whitespace-pre-line">
                {current?.message}
              </AlertDialog.Description>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            {isConfirm && (
              <AlertDialog.Cancel asChild>
                <Button variant="outline" onClick={() => close(false)}>
                  {current?.cancelText ?? "Cancel"}
                </Button>
              </AlertDialog.Cancel>
            )}
            <AlertDialog.Action asChild>
              <Button
                variant={current?.destructive ? "destructive" : "default"}
                className={current?.destructive ? "" : "bg-[#e78a53] text-white hover:bg-[#e78a53]/90"}
                onClick={() => close(true)}
              >
                {current?.confirmText ?? (isConfirm ? "Confirm" : "OK")}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
