import type { DialogVariant } from '../types/dialog'
import styles from './Dialog.module.css'

type DialogProps = {
  open: boolean
  variant: DialogVariant
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const DEFAULT_TITLES: Record<DialogVariant, string> = {
  alert: 'aviso',
  confirm: 'confirmar',
  error: 'error',
}

const DEFAULT_CONFIRM: Record<DialogVariant, string> = {
  alert: 'ok',
  confirm: 'confirmar',
  error: 'ok',
}

export default function Dialog({
  open,
  variant,
  title,
  message,
  confirmLabel,
  cancelLabel = 'cancelar',
  destructive,
  onConfirm,
  onCancel,
}: DialogProps) {
  if (!open) return null

  const isConfirm = variant === 'confirm'
  const resolvedTitle = title ?? DEFAULT_TITLES[variant]
  const resolvedConfirm = confirmLabel ?? DEFAULT_CONFIRM[variant]

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        className={`${styles.dialog} ${variant === 'error' ? styles.error : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <h2 id="dialog-title" className={styles.title}>{resolvedTitle}</h2>
        <p className={styles.message}>{message}</p>

        <div className={`${styles.actions} ${!isConfirm ? styles.actionsSingle : ''}`}>
          {isConfirm && (
            <button type="button" className={`${styles.btn} ${styles.cancelBtn}`} onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            className={`${styles.btn} ${destructive ? styles.destructiveBtn : styles.confirmBtn}`}
            onClick={onConfirm}
          >
            {resolvedConfirm}
          </button>
        </div>
      </div>
    </div>
  )
}
