import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authConfigured, callbackUrl, supabase } from './client'
import { AuthContext, type AuthContextValue, type AuthStatus, type AuthUser } from './context'
import { clearTokenGetter, setTokenGetter } from './token'

/** Owns the Supabase session and publishes it to the app. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    // Nothing to wait for when auth is not configured: resolve immediately as
    // signed out so the public app renders instead of hanging on a spinner.
    authConfigured ? 'loading' : 'signed-out',
  )
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    // Captured locally: the imported binding is nullable, and that narrowing
    // does not survive into the async closures below.
    const client = supabase
    if (!client) return

    // The api layer asks for a token through this; supabase-js refreshes it
    // when it is close to expiry, which is why the getter is async and why we
    // register the call rather than a token value that would go stale.
    setTokenGetter(async () => {
      const { data } = await client.auth.getSession()
      return data.session?.access_token ?? null
    })

    let active = true

    function apply(session: Session | null) {
      if (!active) return
      setUser(session ? toAuthUser(session) : null)
      setStatus(session ? 'signed-in' : 'signed-out')
    }

    void client.auth.getSession().then(({ data }) => apply(data.session))

    // Fires on sign-in, sign-out, token refresh, and in other tabs — so
    // signing out in one tab signs out everywhere, which is what a user
    // clicking "sign out" on a shared machine expects.
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      apply(session)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
      clearTokenGetter()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      configured: authConfigured,

      async signInWithGoogle(next = '/') {
        if (!supabase) return
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: callbackUrl(next),
            queryParams: {
              // Ask Google for a refresh token and show the account chooser
              // rather than silently reusing whichever account is already
              // signed in — people share machines.
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        })
      },

      async signOut() {
        if (!supabase) return
        await supabase.auth.signOut()
      },
    }),
    [status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function toAuthUser(session: Session): AuthUser {
  const metadata = session.user.user_metadata ?? {}
  const name =
    typeof metadata.full_name === 'string'
      ? metadata.full_name
      : typeof metadata.name === 'string'
        ? metadata.name
        : (session.user.email ?? 'Signed in')

  const avatar =
    typeof metadata.avatar_url === 'string'
      ? metadata.avatar_url
      : typeof metadata.picture === 'string'
        ? metadata.picture
        : null

  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name,
    avatarUrl: avatar,
  }
}
