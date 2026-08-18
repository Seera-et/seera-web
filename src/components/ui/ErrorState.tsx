import { AlertTriangle, RotateCcw } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/utils/cn'
import { Button } from './Button'
import { IconTile } from './IconTile'

/**
 * An actionable failure: what went wrong, what to do about it, and a retry when
 * retrying could work.
 */
export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown
  onRetry?: () => void
  className?: string
}) {
  const { title, message, requestId, retryable } = describe(error)

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      <IconTile size="lg" tone="danger">
        <AlertTriangle />
      </IconTile>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="max-w-md text-sm leading-relaxed text-ink-soft">{message}</p>
      {onRetry && retryable ? (
        <Button variant="secondary" leadingIcon={<RotateCcw />} onClick={onRetry}>
          Try again
        </Button>
      ) : null}
      {requestId ? (
        <p className="text-xs text-ink-muted">
          Request ID <code className="font-mono">{requestId}</code>
        </p>
      ) : null}
    </div>
  )
}

/** Maps an error to copy. Backend `code`s get specific wording; everything else
 * falls back to something honest rather than "an error occurred". */
function describe(error: unknown): {
  title: string
  message: string
  requestId?: string
  retryable: boolean
} {
  if (error instanceof ApiError) {
    const base = { requestId: error.requestId, retryable: error.retryable }

    switch (error.code) {
      case 'quota_exhausted':
        return {
          ...base,
          title: 'The AI provider quota is used up',
          message:
            'Seera is over its provider quota for now. Answers will work again once it resets — nothing is wrong with your question.',
        }
      case 'rate_limited':
        return {
          ...base,
          title: 'Too many requests',
          message: 'Wait a few seconds and ask again.',
        }
      case 'invalid_request':
      case 'invalid_json':
        return {
          ...base,
          title: 'That question could not be sent',
          message: error.message,
        }
      case 'network_error':
        return {
          ...base,
          title: 'Cannot reach the Seera API',
          message:
            'The backend did not respond. Check that Postgres and the Go API are running, then try again.',
        }
      case 'stream_closed':
        return {
          ...base,
          title: 'The answer was cut off',
          message: error.message,
        }
      default:
        return { ...base, title: 'Something went wrong', message: error.message }
    }
  }

  return {
    title: 'Something went wrong',
    message:
      error instanceof Error
        ? error.message
        : 'An unexpected problem stopped this from loading.',
    retryable: true,
  }
}
