import { MessageSquare } from 'lucide-react'
import { Chip, EmptyState } from '@/components/ui'
import { SUGGESTED_QUESTIONS } from './suggestions'
import type { ChatQuery } from './url'

/** The idle state: what this can do, and four ways to start. */
export function ChatEmptyState({ onAsk }: { onAsk: (query: ChatQuery) => void }) {
  return (
    <EmptyState
      icon={<MessageSquare />}
      title="Ask about Ethiopian law"
      description="Questions in English or Amharic. Every answer cites the article it came from, and says so plainly when the corpus has no answer."
      action={
        <div className="mt-2 flex max-w-2xl flex-wrap justify-center gap-2">
          {SUGGESTED_QUESTIONS.map((suggestion) => (
            <Chip
              key={suggestion.question}
              onClick={() =>
                onAsk({
                  question: suggestion.question,
                  language: suggestion.language,
                })
              }
            >
              {suggestion.question}
            </Chip>
          ))}
        </div>
      }
    />
  )
}
