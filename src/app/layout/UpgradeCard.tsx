import { Sparkles } from 'lucide-react'
import { Button, Card, IconTile } from '@/components/ui'

/**
 * The left rail promo from the design. Static: there is no billing backend, so
 * the button says what it can honestly do — nothing yet.
 */
export function UpgradeCard() {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <IconTile size="sm">
          <Sparkles />
        </IconTile>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Upgrade to Pro</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
            Unlock advanced features and higher usage limits.
          </p>
        </div>
      </div>
      <Button
        className="mt-4 w-full"
        leadingIcon={<Sparkles />}
        disabled
        title="Billing is not connected yet"
      >
        Upgrade Now
      </Button>
    </Card>
  )
}
