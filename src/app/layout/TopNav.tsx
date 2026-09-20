import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { useAuth } from '@/lib/auth/useAuth'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { brand } from '../brand'
import { navFor } from '../navigation'
import { ApiStatus } from './ApiStatus'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { status } = useAuth()
  const nav = navFor(status === 'signed-in')

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 rounded-lg py-1"
          aria-label={`${brand.name} home`}
        >
          <BrandMark />
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight text-ink">
              {brand.name}
            </span>
            <span className="hidden text-[0.7rem] text-ink-muted sm:block">
              {brand.tagline}
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="mx-auto hidden h-full items-center gap-1 lg:flex"
        >
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClasses}>
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <ApiStatus className="hidden md:inline-flex" />
          <ThemeToggle />
          <UserMenu />
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          aria-label="Primary"
          className="animate-fade-in border-t border-line bg-surface px-4 py-2 lg:hidden"
        >
          <ul className="flex flex-col">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-12 items-center gap-3 rounded-control px-3 text-sm font-medium',
                      isActive
                        ? 'bg-surface-accent text-brand-700 dark:text-brand-200'
                        : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
                    )
                  }
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="px-3 py-3">
            <ApiStatus />
          </div>
        </nav>
      ) : null}
    </header>
  )
}

/** Active state is an underline plus a colour change — not colour alone. */
function navLinkClasses({ isActive }: { isActive: boolean }): string {
  return cn(
    'flex h-16 items-center gap-2 border-b-2 px-3.5 text-sm font-medium transition-colors',
    isActive
      ? 'border-brand-600 text-brand-700 dark:text-brand-300'
      : 'border-transparent text-ink-soft hover:text-ink',
  )
}
