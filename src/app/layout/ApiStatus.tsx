import { useHealth } from '@/lib/api/queries'
import { cn } from '@/lib/utils/cn'

type ConnectionState = 'checking' | 'online' | 'degraded' | 'offline'

const presentation: Record<
  ConnectionState,
  { dot: string; label: string; detail: string }
> = {
  checking: {
    dot: 'bg-ink-muted animate-pulse',
    label: 'Checking',
    detail: 'Contacting the Seera API…',
  },
  online: {
    dot: 'bg-success-500',
    label: 'Connected',
    detail: 'API and database are responding.',
  },
  degraded: {
    dot: 'bg-warning-500',
    label: 'Degraded',
    detail: 'The API is up but its database check failed. Answers will fail.',
  },
  offline: {
    dot: 'bg-danger-500',
    label: 'Offline',
    detail:
      'No response from the API. Start the backend (docker compose up, then go run ./cmd/api).',
  },
}

/**
 * Backend connection indicator, driven by GET /healthz.
 *
 * Worth a permanent place in the header: "I asked a question and nothing
 * happened" is usually a backend that is not running, and this turns that into
 * something visible. Text plus a dot, never colour alone.
 */
export function ApiStatus({ className }: { className?: string }) {
  const { data, isPending, isError } = useHealth()

  const state: ConnectionState = isPending
    ? 'checking'
    : isError
      ? 'offline'
      : data?.status === 'ok' && data.db === 'up'
        ? 'online'
        : 'degraded'

  const { dot, label, detail } = presentation[state]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-sunken px-2.5 py-1',
        className,
      )}
      title={detail}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', dot)} />
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      <span className="sr-only">: {detail}</span>
    </span>
  )
}
