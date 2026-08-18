/**
 * The global UI kit. Presentational primitives only — nothing here fetches, and
 * nothing here knows about legal domain rules.
 *
 * A component earns a place in this folder on its second real consumer; before
 * that it lives in the feature that uses it.
 */

export { ActionCard } from './ActionCard'
export { Avatar } from './Avatar'
export { Badge, type BadgeTone } from './Badge'
export { Button, ButtonLink } from './Button'
export {
  buttonClasses,
  chipClasses,
  type ButtonSize,
  type ButtonVariant,
} from './variants'
export { Callout, type CalloutTone } from './Callout'
export {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardSection,
  CardTitle,
} from './Card'
export { Chip, ChipLink } from './Chip'
export { Drawer } from './Drawer'
export { EmptyState } from './EmptyState'
export { ErrorState } from './ErrorState'
export { IconTile, type IconTileSize, type IconTileTone } from './IconTile'
export { Input, Textarea } from './Input'
export { PageHeader } from './PageHeader'
export { Select, type SelectOption } from './Select'
export { SegmentedControl, type Segment } from './SegmentedControl'
export { Skeleton, SkeletonText } from './Skeleton'
export { Spinner } from './Spinner'
export { Tabs, type Tab } from './Tabs'
export { StatCard } from './StatCard'
