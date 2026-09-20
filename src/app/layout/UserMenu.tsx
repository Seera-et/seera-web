import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LogIn, LogOut, Sparkles, User } from 'lucide-react'
import { Avatar, Button } from '@/components/ui'
import { signInPath } from '@/features/auth/url'
import { useAuth } from '@/lib/auth/useAuth'
import { cn } from '@/lib/utils/cn'

/**
 * The account control in the header.
 *
 * Signed out it is a Sign in button, not a menu of things that do nothing —
 * this replaced a placeholder that rendered a fictional user and disabled
 * items, which was fine before accounts existed and is a lie now.
 */
export function UserMenu() {
  const { status, user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Close the menu when the route changes, or it hangs over the new page.
  // Adjusted during render rather than in an effect: React re-runs this pass
  // before touching the DOM, so the menu never paints over the new route.
  const [menuRoute, setMenuRoute] = useState(location.pathname)
  if (menuRoute !== location.pathname) {
    setMenuRoute(location.pathname)
    setOpen(false)
  }

  if (status === 'loading') {
    // A neutral placeholder of the same size, so the header does not jump when
    // the session resolves.
    return <div className="size-9 animate-pulse rounded-full bg-surface-sunken" />
  }

  if (status === 'signed-out' || !user) {
    const here = location.pathname + location.search
    return (
      <Button
        size="sm"
        variant="secondary"
        leadingIcon={<LogIn />}
        onClick={() => navigate(signInPath(here === '/' ? undefined : here))}
      >
        Sign in
      </Button>
    )
  }

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
        <Avatar name={user.name} src={user.avatarUrl} size="sm" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[10rem] truncate text-sm font-semibold text-ink">
            {user.name}
          </span>
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
            <Avatar name={user.name} src={user.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
          </div>

          <div className="p-2">
            {/* Still placeholders — there is no billing and no profile screen.
                Marked disabled rather than removed so the shape of the menu
                does not change when they arrive. */}
            <MenuItem icon={<Sparkles />} label="Upgrade to Pro" disabled />
            <MenuItem icon={<User />} label="Profile" disabled />
            <MenuItem
              icon={<LogOut />}
              label="Sign out"
              onClick={() => {
                setOpen(false)
                void signOut().then(() => navigate('/'))
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: ReactNode
  label: string
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
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
