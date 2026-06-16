import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Dialog from '../components/Dialog'
import type { DialogVariant } from '../types/dialog'

export type { DialogVariant } from '../types/dialog'

type DialogState = {
  variant: DialogVariant
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

type DialogContextType = {
  alert: (message: string, title?: string) => Promise<void>
  confirm: (message: string, title?: string, options?: { destructive?: boolean; confirmLabel?: string }) => Promise<boolean>
  error: (message: string, title?: string) => Promise<void>
}

const DialogContext = createContext<DialogContextType | null>(null)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const close = useCallback((result: boolean) => {
    resolveRef.current?.(result)
    resolveRef.current = null
    setState(null)
  }, [])

  const openDialog = useCallback((dialog: DialogState): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setState(dialog)
    })
  }, [])

  const alert = useCallback(
    (message: string, title?: string) =>
      openDialog({ variant: 'alert', message, title }).then(() => undefined),
    [openDialog],
  )

  const confirm = useCallback(
    (message: string, title?: string, options?: { destructive?: boolean; confirmLabel?: string }) =>
      openDialog({
        variant: 'confirm',
        message,
        title,
        destructive: options?.destructive,
        confirmLabel: options?.confirmLabel,
      }),
    [openDialog],
  )

  const error = useCallback(
    (message: string, title?: string) =>
      openDialog({ variant: 'error', message, title }).then(() => undefined),
    [openDialog],
  )

  return (
    <DialogContext.Provider value={{ alert, confirm, error }}>
      {children}
      {state && (
        <Dialog
          open
          variant={state.variant}
          title={state.title}
          message={state.message}
          confirmLabel={state.confirmLabel}
          cancelLabel={state.cancelLabel}
          destructive={state.destructive}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog debe usarse dentro de DialogProvider')
  return ctx
}
