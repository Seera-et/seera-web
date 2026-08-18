import { BookOpenCheck, Bookmark, History, MessageSquare } from 'lucide-react'
import { ActionCard } from '@/components/ui'
import { brand } from '@/app/brand'

/** Every card here goes somewhere real — no dead ends for features that do not
 * exist yet. */
const destinations = [
  {
    icon: <MessageSquare />,
    title: 'AI legal chat',
    description:
      'Ask a question and get a streamed answer with the article it rests on.',
    cta: 'Start chat',
    to: '/chat',
  },
  {
    icon: <BookOpenCheck />,
    title: 'Legal explorer',
    description:
      'Browse indexed codes, proclamations and directives by area of law.',
    cta: 'Explore laws',
    to: '/explorer',
  },
  {
    icon: <Bookmark />,
    title: 'Bookmarks',
    description: 'Keep the articles and answers you need to come back to.',
    cta: 'View bookmarks',
    to: '/bookmarks',
  },
  {
    icon: <History />,
    title: 'History',
    description: 'Revisit an earlier question and the sources it was answered from.',
    cta: 'View history',
    to: '/history',
  },
]

export function ExploreGrid() {
  return (
    <section
      aria-labelledby="explore-heading"
      className="rounded-card border border-line bg-surface p-5 shadow-soft sm:p-6"
    >
      <h2 id="explore-heading" className="text-lg font-semibold text-ink">
        Explore {brand.name}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {destinations.map((item) => (
          <ActionCard key={item.to} {...item} />
        ))}
      </div>
    </section>
  )
}
