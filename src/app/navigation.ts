import {
  BookOpenCheck,
  Bookmark,
  Briefcase,
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
  /**
   * Hidden from signed-out visitors because the page holds nothing for them.
   *
   * Chat and Advisor are deliberately *not* marked: they are what the product
   * is for, and a visitor should be able to click them, see what they are, and
   * be asked to sign in — rather than never learn they exist. Bookmarks and
   * History are different: they are empty containers for a stranger, so
   * showing them only advertises a login wall.
   */
  accountOnly?: boolean
}

/** The primary navigation, in the order the design shows it. */
export const primaryNav: readonly NavItem[] = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/explorer', label: 'Legal Explorer', icon: BookOpenCheck },
  { to: '/advisor', label: 'Business Advisor', icon: Briefcase },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark, accountOnly: true },
  { to: '/history', label: 'History', icon: History, accountOnly: true },
  { to: '/about', label: 'About', icon: Info },
] as const

/** The navigation as it should appear for this visitor. */
export function navFor(signedIn: boolean): readonly NavItem[] {
  return signedIn ? primaryNav : primaryNav.filter((item) => !item.accountOnly)
}
