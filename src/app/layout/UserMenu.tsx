import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, LogOut, Settings, Sparkles, User } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { AUTH_ENABLED, PLACEHOLDER_USER } from '../session'

/**
 * The account dropdown. Its items are inert while `AUTH_ENABLED` is false — the
 * backend has no auth endpoints, and a menu that pretends otherwise is worse
 * than one that says so.
 */
export function UserMenu() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const user = PLACEHOLDER_USER

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors',
          'hover:bg-surface-sunken',
        )}
      >
        <Avatar name={user.name} size="sm" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold text-ink">{user.name}</span>
          <span className="block text-xs text-ink-muted">{user.plan}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-4 text-ink-muted transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className={cn(
            'absolute right-0 z-50 mt-2 w-64 animate-fade-in overflow-hidden',
            'rounded-card border border-line bg-surface shadow-float',
          )}
        >
          <div className="flex items-center gap-3 border-b border-line p-4">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
          </div>

          <div className="p-2">
            <MenuItem icon={<Sparkles />} label="Upgrade to Pro" />
            <MenuItem icon={<User />} label="Profile" />
            <MenuItem icon={<Settings />} label="Settings" />
            <MenuItem icon={<LogOut />} label="Sign out" />
          </div>

          {!AUTH_ENABLED ? (
            <p className="border-t border-line px-4 py-2.5 text-xs text-ink-muted">
              Accounts are not connected yet. These are placeholders.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function MenuItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={!AUTH_ENABLED}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm',
        'text-ink-soft transition-colors [&_svg]:size-4',
        'enabled:hover:bg-surface-sunken enabled:hover:text-ink',
        'disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
