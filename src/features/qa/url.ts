/**
 * Chat state that lives in the URL.
 *
 * The question, the language filter, the as-of date and the open source panel are
 * all shareable and reloadable, so the address bar owns them rather than a store
 * (frontend-react skill, state tier 2).
 */

import type { Language } from '@/lib/api'

export const PARAM = {
  question: 'q',
  language: 'lang',
  asOf: 'as_of',
  /** chunk_id of the citation whose source panel is open. */
  source: 'source',
  /** id of the conversation thread being continued. */
  conversation: 'c',
} as const

export type ChatQuery = {
  question: string
  /** Undefined searches both languages, which is the backend default. */
  language?: Language
  /** `YYYY-MM-DD`. */
  asOf?: string
}

export function isLanguage(value: string | null): value is Language {
  return value === 'en' || value === 'am'
}

export function readChatQuery(params: URLSearchParams): ChatQuery {
  const language = params.get(PARAM.language)
  const asOf = params.get(PARAM.asOf)
  return {
    question: params.get(PARAM.question)?.trim() ?? '',
    language: isLanguage(language) ? language : undefined,
    asOf: asOf && /^\d{4}-\d{2}-\d{2}$/.test(asOf) ? asOf : undefined,
  }
}

export function chatSearch(
  query: ChatQuery,
  conversationId?: string | null,
): string {
  const params = new URLSearchParams()
  if (query.question) params.set(PARAM.question, query.question)
  if (query.language) params.set(PARAM.language, query.language)
  if (query.asOf) params.set(PARAM.asOf, query.asOf)
  if (conversationId) params.set(PARAM.conversation, conversationId)
  const search = params.toString()
  return search ? `?${search}` : ''
}

/** Link target for "ask this question", used from Home, History and Bookmarks. */
export function chatPath(query: ChatQuery): string {
  return `/chat${chatSearch(query)}`
}

/** Link target for reopening a saved thread. */
export function conversationPath(conversationId: string): string {
  return `/chat?${PARAM.conversation}=${encodeURIComponent(conversationId)}`
}
