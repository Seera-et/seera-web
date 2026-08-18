import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from './Button'

type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  /** Rendered under the title, inside the labelled region. */
  subtitle?: ReactNode
  footer?: ReactNode
  /** `right` is a desktop side panel; `bottom` is the mobile sheet. */
  side?: 'right' | 'bottom'
  children: ReactNode
}

/**
 * Modal side panel, built on `<dialog>`.
 *
 * Native `showModal()` gives the focus trap, Esc-to-close and focus restoration
 * that the accessibility rules require — a hand-rolled trap would be more code
 * and get one of the three wrong.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  side = 'right',
  children,
}: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onCancel={(event) => {
        // Esc: close through React state so `open` stays the source of truth.
        event.preventDefault()
        onClose()
      }}
      onClose={onClose}
      onClick={(event) => {
        // The dialog element covers the viewport and the panel sits inside it, so
        // a click landing on the dialog itself is a click on the backdrop.
        if (event.target === dialogRef.current) onClose()
      }}
      className={cn(
        'fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0',
        'backdrop:bg-ink/50 backdrop:backdrop-blur-sm',
        // `hidden` is not decoration, it is required.
        //
        // A closed <dialog> is hidden by a user-agent rule, and any author
        // `display` declaration outranks the UA origin regardless of
        // specificity. An unconditional `flex` here therefore left the closed
        // dialog laid out at inset-0: an invisible full-viewport overlay that
        // swallowed every click on the page beneath it.
        open ? 'flex' : 'hidden',
        side === 'right' ? 'items-stretch justify-end' : 'items-end justify-center',
      )}
    >
      {open ? (
        <div
          className={cn(
            'flex min-h-0 flex-col bg-surface shadow-float',
            side === 'right'
              ? 'h-full w-full max-w-xl animate-slide-in-right border-l border-line'
              : 'max-h-[85vh] w-full animate-slide-in-up rounded-t-2xl border-t border-line',
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink">{title}</h2>
              {subtitle ? (
                <div className="mt-0.5 text-sm text-ink-soft">{subtitle}</div>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close panel"
            >
              <X />
            </Button>
          </header>

          <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>

          {footer ? (
            <footer className="border-t border-line px-5 py-3">{footer}</footer>
          ) : null}
        </div>
      ) : null}
    </dialog>
  )
}
