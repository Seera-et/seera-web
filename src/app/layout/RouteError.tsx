import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { ButtonLink, Card, ErrorState } from '@/components/ui'

/** Last-resort boundary: a render error in a route must not blank the whole app. */
export function RouteError() {
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound />
  }

  return (
    <Card className="mx-auto max-w-xl">
      <ErrorState
        error={error}
        onRetry={() => window.location.reload()}
      />
    </Card>
  )
}

export function NotFound() {
  return (
    <Card className="mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="text-xl font-semibold text-ink">This page does not exist</h1>
      <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
        The link may be out of date. Everything Seera can do is reachable from the
        navigation above.
      </p>
      <ButtonLink to="/" className="mt-2">
        Back to home
      </ButtonLink>
    </Card>
  )
}
