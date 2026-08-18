import type { ReactNode } from 'react'
import { Card } from './Card'
import { IconTile } from './IconTile'
import { Skeleton } from './Skeleton'

/** One number and what it counts. */
export function StatCard({
  icon,
  value,
  label,
  loading = false,
}: {
  icon: ReactNode
  value: string
  label: string
  loading?: boolean
}) {
  return (
    <Card className="flex items-center gap-3.5 p-4">
      <IconTile>{icon}</IconTile>
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="h-6 w-16" />
        ) : (
          <p className="text-xl font-semibold leading-tight text-ink">{value}</p>
        )}
        <p className="truncate text-xs text-ink-muted">{label}</p>
      </div>
    </Card>
  )
}
