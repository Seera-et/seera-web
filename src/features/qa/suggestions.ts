/**
 * Starter questions.
 *
 * Prompts only — no legal statement is asserted here, and no answer is
 * pre-baked. Shown on the home hero and in the chat page's idle state.
 */
export type Suggestion = {
  question: string
  /** Language to ask in. `am` questions are written in Amharic. */
  language?: 'en' | 'am'
}

export const SUGGESTED_QUESTIONS: readonly Suggestion[] = [
  { question: 'How do I register a company in Ethiopia?' },
  { question: 'What are the requirements for a business licence?' },
  { question: 'What does Article 627 of the Commercial Code say?' },
  { question: 'What notice period applies when ending an employment contract?' },
] as const
