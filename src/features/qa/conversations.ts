import { createLocalStore, useStore } from '@/lib/store/createLocalStore'
import type {
  AnswerCitation,
  AnswerKind,
  AnswerTimings,
  Suggestion,
  HistoryTurn,
  Language,
} from '@/lib/api'
import { truncate } from '@/lib/utils/format'

/**
 * Conversations, stored in this browser.
 *
 * The backend keeps no conversation state, deliberately: it logs no answer text
 * and there is no authentication to own a thread. So the client owns the
 * transcript and sends the turns a follow-up depends on with each request.
 *
 * This store holds *completed* turns only. An in-flight answer lives in
 * component state until it finishes — a half-streamed answer is not something to
 * persist and reload.
 */

/** One finished exchange. */
export type StoredTurn = {
  id: string
  question: string
  language?: Language
  asOf?: string
  answer: string
  citations: AnswerCitation[]
  /** Absent on turns stored before conversational replies existed. */
  kind?: AnswerKind
  /** Follow-up questions offered with this answer. */
  related?: Suggestion[]
  /** The answer stopped at the output limit rather than finishing. */
  truncated?: boolean
  abstained: boolean
  grounded: boolean
  askedAt: number

  /** How the answer was produced. Kept so a reloaded turn can still show what
   * model answered it and how long each stage took. */
  model: string
  reranker: string
  timings: AnswerTimings
  requestId: string | null
}

export type Conversation = {
  id: string
  /** Derived from the first question. */
  title: string
  createdAt: number
  updatedAt: number
  turns: StoredTurn[]
}

/**
 * Storage bounds. localStorage is a few megabytes and a legal answer with five
 * cited provisions is not small, so both the number of threads and the size of a
 * stored citation are capped. The full source text is never lost by this: a
 * citation re-resolves from the API by chunk id.
 */
const MAX_CONVERSATIONS = 25
const MAX_TURNS_PER_CONVERSATION = 40
const MAX_STORED_CITATION_CHARS = 600
const TITLE_CHARS = 80

/** How many earlier turns are sent with a follow-up. The API trims again. */
const HISTORY_TURNS = 6

const conversationsStore = createLocalStore<Conversation[]>(
  'seera.conversations.v1',
  [],
  Array.isArray,
)

/**
 * Repairs transcripts written while appendTurn could run twice for one turn.
 *
 * Those threads hold two entries with the same turn id, which shows every
 * exchange on the page twice and collides React keys. Runs once on load, only
 * writes when something actually changed, and is harmless on clean data.
 *
 * Deletable once no browser can still be holding a transcript from before
 * 2026-08-18.
 */
function repairDuplicateTurns(): void {
  const conversations = conversationsStore.get()
  let repaired = false

  const cleaned = conversations.map((conversation) => {
    const seen = new Set<string>()
    const turns = conversation.turns.filter((turn) => {
      if (seen.has(turn.id)) return false
      seen.add(turn.id)
      return true
    })

    if (turns.length === conversation.turns.length) return conversation
    repaired = true
    return { ...conversation, turns }
  })

  if (repaired) conversationsStore.set(cleaned)
}

repairDuplicateTurns()

export function useConversations(): Conversation[] {
  return useStore(conversationsStore)
}

/** The named conversation, or undefined if it has no stored turns yet. */
export function useConversation(id: string | null): Conversation | undefined {
  const conversations = useStore(conversationsStore)
  if (!id) return undefined
  return conversations.find((conversation) => conversation.id === id)
}

export function newConversationId(): string {
  return crypto.randomUUID()
}

/**
 * Appends a finished turn, creating the conversation if this is its first.
 *
 * Idempotent on the turn id: appending the same turn twice replaces it rather
 * than adding a second copy. Belt and braces after a bug that stored every
 * exchange twice — a double write here is always a mistake, and the store is the
 * one place that can refuse it for every caller.
 *
 * Newest conversation first, so the store order is also the display order.
 */
export function appendTurn(conversationId: string, turn: StoredTurn): void {
  const stored: StoredTurn = {
    ...turn,
    citations: turn.citations.map(trimCitation),
  }

  conversationsStore.set((previous) => {
    const existing = previous.find((c) => c.id === conversationId)

    if (!existing) {
      const conversation: Conversation = {
        id: conversationId,
        title: truncate(turn.question, TITLE_CHARS),
        createdAt: turn.askedAt,
        updatedAt: turn.askedAt,
        turns: [stored],
      }
      return [conversation, ...previous].slice(0, MAX_CONVERSATIONS)
    }

    const alreadyStored = existing.turns.some((item) => item.id === turn.id)
    const turns = alreadyStored
      ? existing.turns.map((item) => (item.id === turn.id ? stored : item))
      : [...existing.turns, stored].slice(-MAX_TURNS_PER_CONVERSATION)

    const updated: Conversation = {
      ...existing,
      updatedAt: turn.askedAt,
      turns,
    }
    return [updated, ...previous.filter((c) => c.id !== conversationId)]
  })
}

export function deleteConversation(id: string): void {
  conversationsStore.set((previous) => previous.filter((c) => c.id !== id))
}

export function clearConversations(): void {
  conversationsStore.set([])
}

/**
 * The history to send with the next question in a thread.
 *
 * Both sides of each exchange, oldest last-N first: a follow-up like "and the
 * second one?" needs the answer as much as the question. An abstention is
 * included as what it was, so the model does not treat a refusal as an answer it
 * can build on.
 */
export function historyFor(conversation: Conversation | undefined): HistoryTurn[] {
  if (!conversation) return []

  return conversation.turns
    .slice(-HISTORY_TURNS)
    .flatMap((turn): HistoryTurn[] => [
      { role: 'user', text: turn.question },
      { role: 'assistant', text: turn.answer },
    ])
    .filter((turn) => turn.text.trim() !== '')
}

/**
 * The chunk ids a follow-up should carry: everything cited in the recent turns,
 * newest first and deduplicated.
 *
 * Identifiers only. The server re-reads the text, which is what keeps a client
 * from being able to put words into a grounded answer.
 */
export function carriedChunkIds(conversation: Conversation | undefined): string[] {
  if (!conversation) return []

  const ids: string[] = []
  const seen = new Set<string>()

  for (const turn of conversation.turns.slice(-HISTORY_TURNS).reverse()) {
    for (const citation of turn.citations) {
      if (seen.has(citation.chunkId)) continue
      seen.add(citation.chunkId)
      ids.push(citation.chunkId)
      if (ids.length >= MAX_CARRIED_CHUNKS) return ids
    }
  }
  return ids
}

/** Matches the server's own cap, so nothing is sent that will only be trimmed. */
const MAX_CARRIED_CHUNKS = 12

/** Stored citations keep their identifiers and a snippet; the API has the rest. */
function trimCitation(citation: AnswerCitation): AnswerCitation {
  if (citation.text.length <= MAX_STORED_CITATION_CHARS) return citation
  return { ...citation, text: truncate(citation.text, MAX_STORED_CITATION_CHARS) }
}
