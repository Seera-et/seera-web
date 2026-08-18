import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { HelpCard } from './HelpCard'
import { SiteFooter } from './SiteFooter'
import { TopNav } from './TopNav'
import { UpgradeCard } from './UpgradeCard'

/**
 * The frame every route renders inside: navigation, the two side rails from the
 * design, and the footer.
 *
 * The rails are decoration around a centred column, so they are hidden below
 * `2xl` rather than squeezing the content — and hidden on the chat route, where
 * the conversation should own the full width.
 */
export function AppShell() {
  const { pathname } = useLocation()
  const showRails = pathname !== '/chat'

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <TopNav />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-1 gap-6 px-4 py-6 sm:px-6">
        {showRails ? (
          <aside
            aria-label="Plan"
            className="hidden w-60 shrink-0 flex-col justify-end 2xl:flex"
          >
            <div className="sticky bottom-6">
              <UpgradeCard />
            </div>
          </aside>
        ) : null}

        <main id="main" className="min-w-0 flex-1">
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>

        {showRails ? (
          <aside
            aria-label="Help"
            className="hidden w-60 shrink-0 flex-col justify-end 2xl:flex"
          >
            <div className="sticky bottom-6">
              <HelpCard />
            </div>
          </aside>
        ) : null}
      </div>

      <SiteFooter />
    </div>
  )
}

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="size-6 text-brand-600" label="Loading page" />
    </div>
  )
}
