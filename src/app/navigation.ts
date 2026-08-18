import {
  BookOpenCheck,
  Bookmark,
  History,
  House,
  Info,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  /** Only `/` needs exact matching; the rest should stay active on child routes. */
  end?: boolean
}

/** The primary navigation, in the order the design shows it. */
export const primaryNav: readonly NavItem[] = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/explorer', label: 'Legal Explorer', icon: BookOpenCheck },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/history', label: 'History', icon: History },
  { to: '/about', label: 'About', icon: Info },
] as const
