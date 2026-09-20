import { createContext } from 'react'

/**
 * The session's shape and its context object.
 *
 * Separate from session.tsx, which exports the provider component: a file that
 * exports both a component and a context breaks react-refresh, and the symptom
 * is that every edit during development drops the session and signs you out.
 */

/**
 * `status` is three states rather than a boolean on purpose. Restoring a
 * session from storage is asynchronous, so on every page load there is a moment
 * where the answer is genuinely "not known yet". Collapsing that into
 * `signedIn: false` makes a guarded route bounce a signed-in user to the
 * sign-in screen on every refresh — the classic auth flash.
 */
export type AuthStatus = 'loading' | 'signed-in' | 'signed-out'

export type AuthUser = {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

export type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  /** False when the Supabase environment variables are missing. */
  configured: boolean
  signInWithGoogle: (next?: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
