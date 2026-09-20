import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Button, Callout, Card, CardBody } from '@/components/ui'
import { BrandMark } from '@/components/BrandMark'
import { DISCLAIMER, brand } from '@/app/brand'
import { useAuth } from '@/lib/auth/useAuth'
import { readNext } from './url'

/**
 * The sign-in screen. One provider, one button.
 *
 * It tells the visitor *why* they are here — they pressed Enter on a question,
 * or followed a link to a saved page — because an unexplained login wall in the
 * middle of a task is the most common reason people leave.
 */
export function SignInPage() {
  const [params] = useSearchParams()
  const { status, configured, signInWithGoogle } = useAuth()
  const [pending, setPending] = useState(false)

  const next = readNext(params)

  // Already signed in: nothing to do here. Covers the back button landing on
  // /signin after a successful sign-in, which would otherwise be a dead end.
  if (status === 'signed-in') {
    return <Navigate to={next} replace />
  }

  async function onSignIn() {
    setPending(true)
    try {
      await signInWithGoogle(next)
      // No success branch: signInWithOAuth navigates away from this page.
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandMark />
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Sign in to {brand.name}
        </h1>
        <p className="text-sm text-ink-soft">{reasonFor(next)}</p>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-4">
          {configured ? (
            <>
              <Button
                size="lg"
                onClick={onSignIn}
                loading={pending}
                leadingIcon={<GoogleMark />}
                className="w-full"
              >
                Continue with Google
              </Button>
              <p className="text-center text-xs text-ink-muted">
                We use your Google account only to identify you. Seera never sees
                your password.
              </p>
            </>
          ) : (
            <Callout tone="warning" title="Sign-in is not configured">
              This build is missing <code>VITE_SUPABASE_URL</code> or{' '}
              <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>. Browsing the corpus still
              works; accounts do not.
            </Callout>
          )}
        </CardBody>
      </Card>

      <Callout tone="info" icon={<ShieldCheck />} title="Information, not legal advice">
        {DISCLAIMER}
      </Callout>
    </div>
  )
}

/** Explains the interruption in terms of what the visitor was actually doing. */
function reasonFor(next: string): string {
  if (next.startsWith('/chat')) {
    return 'Asking a question needs an account, so your conversations are saved to you and not to this browser.'
  }
  if (next.startsWith('/bookmarks')) return 'Your saved sources are tied to your account.'
  if (next.startsWith('/history')) return 'Your question history is tied to your account.'
  if (next.startsWith('/advisor')) {
    return 'The Business Advisor keeps your answers so you can come back to them.'
  }
  return 'Sign in to use the parts of Seera that are yours.'
}

/** Google's mark, inline so the button does not depend on a remote asset. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}
