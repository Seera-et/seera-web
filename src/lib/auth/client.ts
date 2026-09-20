/**
 * The Supabase client, and the only place it is constructed.
 *
 * Supabase owns the Google OAuth exchange, the token refresh loop and the user
 * record. This app never sees a password, a client secret or a refresh token it
 * has to store itself — which is most of what makes authentication dangerous to
 * build.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim()

/**
 * Whether sign-in can work at all.
 *
 * Both values are required and neither is secret — the publishable key is
 * designed to be shipped in the bundle, and it is the project's *anonymous*
 * identity, not an admin credential. When they are missing the app stays
 * usable for everything public rather than crashing on import, and the sign-in
 * screen explains itself instead of throwing.
 */
export const authConfigured = url !== '' && publishableKey !== ''

/**
 * Null when unconfigured. Callers must handle that — see `authConfigured` —
 * rather than this module throwing at import time and taking the whole app
 * down over a missing environment variable.
 */
export const supabase: SupabaseClient | null = authConfigured
  ? createClient(url, publishableKey, {
      auth: {
        // The OAuth redirect comes back with the code in the URL; supabase-js
        // completes the exchange and then we clean the address bar ourselves
        // in AuthCallbackPage, so a token never sits in history.
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
      },
    })
  : null

/** Where Google sends the browser back to. Must be registered in Supabase. */
export function callbackUrl(next: string): string {
  const target = new URL('/auth/callback', window.location.origin)
  if (next) target.searchParams.set('next', next)
  return target.toString()
}
