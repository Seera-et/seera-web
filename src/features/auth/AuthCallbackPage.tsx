import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Callout, Spinner } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'
import { readNext, signInPath } from './url'

/**
 * Where Google sends the browser back to.
 *
 * supabase-js does the code-for-session exchange itself (detectSessionInUrl),
 * so this page's job is to wait for the session to land and then get out of the
 * way — and to handle the case where the provider came back with an error
 * instead, which otherwise looks to the user like a blank page.
 */
export function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { status } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  const next = readNext(params)

  // The provider reports a refusal in the query string rather than by failing
  // the redirect: a closed consent screen arrives here as error=access_denied.
  const providerError = params.get('error_description') ?? params.get('error')

  useEffect(() => {
    if (providerError) return
    if (status === 'signed-in') {
      // replace, so Back does not return to this transient URL — which still
      // carries the OAuth parameters.
      navigate(next, { replace: true })
    }
  }, [status, next, navigate, providerError])

  // If the exchange never completes we must not spin forever. Ten seconds is
  // far longer than the handoff takes and short enough not to feel broken.
  useEffect(() => {
    if (providerError || status === 'signed-in') return
    const timer = setTimeout(() => setTimedOut(true), 10_000)
    return () => clearTimeout(timer)
  }, [status, providerError])

  if (providerError || timedOut) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 py-12">
        <Callout tone="danger" title="Sign-in did not complete">
          {providerError
            ? decodeURIComponent(providerError)
            : 'The sign-in did not finish. This is usually a redirect URL that is not registered for this site.'}
        </Callout>
        <Button onClick={() => navigate(signInPath(next), { replace: true })}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Spinner className="size-6 text-brand-600" label="Completing sign-in" />
      <p className="text-sm text-ink-muted">Completing sign-in…</p>
    </div>
  )
}
