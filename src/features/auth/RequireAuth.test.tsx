import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '@/lib/auth/context'
import { stubAuth } from '@/test/utils'
import { RequireAuth } from './RequireAuth'
import type { AuthStatus } from '@/lib/auth/context'

/** The guard, mounted the way routes.tsx mounts it. */
function renderAt(path: string, status: AuthStatus) {
  return render(
    <AuthContext.Provider value={stubAuth(status)}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/bookmarks" element={<p>saved sources</p>} />
          </Route>
          <Route path="/signin" element={<SignInProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

/** Stands in for the sign-in page and reports where it was told to return to. */
function SignInProbe() {
  const next = new URLSearchParams(window.location.search).get('next')
  return <p>sign in{next ? ` → ${next}` : ''}</p>
}

describe('RequireAuth', () => {
  it('renders the page for a signed-in visitor', () => {
    renderAt('/bookmarks', 'signed-in')
    expect(screen.getByText('saved sources')).toBeInTheDocument()
  })

  it('redirects a signed-out visitor to sign in', () => {
    renderAt('/bookmarks', 'signed-out')
    expect(screen.queryByText('saved sources')).not.toBeInTheDocument()
    expect(screen.getByText(/sign in/)).toBeInTheDocument()
  })

  // Restoring a session from storage is async. Redirecting during that window
  // bounces a signed-in user to the login screen every time they refresh — so
  // the guard must render neither outcome until it knows.
  it('shows neither the page nor a redirect while the session is loading', () => {
    renderAt('/bookmarks', 'loading')
    expect(screen.queryByText('saved sources')).not.toBeInTheDocument()
    expect(screen.queryByText(/sign in/)).not.toBeInTheDocument()
    expect(screen.getByText('Checking your session')).toBeInTheDocument()
  })
})
