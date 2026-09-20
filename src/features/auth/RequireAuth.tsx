import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'
import { signInPath } from './url'

/**
 * The route guard. Used as a layout route, so every child route under it is
 * protected by construction rather than by each page remembering to check.
 *
 * This guard is presentation, not security. It decides what to render; it
 * cannot decide what the API will serve, and the API is what actually costs
 * money. The real control is `requireUser` in the Go server — see
 * docs/AUTH_FEATURE_PLAN.md. If these two ever disagree, the server wins and
 * the user sees a 401, which is the correct way round.
 */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  // Restoring a session from storage is async. Rendering the redirect during
  // that window would bounce a signed-in user to the sign-in screen every time
  // they refresh a protected page.
  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="size-6 text-brand-600" label="Checking your session" />
      </div>
    )
  }

  if (status === 'signed-out') {
    // The full path, so a deep link survives the round trip through Google:
    // open /bookmarks signed out and you land back on /bookmarks, not on /.
    const next = location.pathname + location.search + location.hash
    return <Navigate to={signInPath(next)} replace />
  }

  return <Outlet />
}
