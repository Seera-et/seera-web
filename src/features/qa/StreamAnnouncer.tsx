import type { Turn } from './useQaConversation'

/**
 * The live region for the answer stream.
 *
 * Announces state changes, not tokens: a polite region fed every token would read
 * the answer aloud several words at a time, forever behind the text. The answer
 * itself is ordinary readable content once it is there.
 */
export function StreamAnnouncer({ turn }: { turn: Turn | undefined }) {
  return (
    <p aria-live="polite" aria-atomic="true" className="sr-only">
      {turn ? message(turn) : ''}
    </p>
  )
}

function message(turn: Turn): string {
  switch (turn.phase) {
    case 'retrieving':
      return 'Searching Ethiopian legal sources.'
    case 'streaming':
      return 'Answer is being written.'
    case 'done':
      if (turn.summary?.abstained) {
        return 'No grounded answer was found. Seera declined to guess.'
      }
      return `Answer complete, with ${turn.citations.length} ${
        turn.citations.length === 1 ? 'source' : 'sources'
      }.`
    case 'cancelled':
      return 'Answer stopped.'
    case 'error':
      return `Answer failed. ${turn.error?.message ?? ''}`
  }
}
