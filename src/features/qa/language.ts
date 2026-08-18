import type { Segment } from '@/components/ui'
import type { Language } from '@/lib/api'

/**
 * Which language the *sources* are drawn from — not the language of the answer.
 * An English question can be answered from an Amharic provision, which is why
 * "both" is the default and maps to omitting `language` from the request.
 */
export type LanguageChoice = Language | 'both'

export const LANGUAGE_SEGMENTS: readonly Segment<LanguageChoice>[] = [
  { value: 'both', label: 'Both' },
  { value: 'en', label: 'EN', srLabel: 'English' },
  { value: 'am', label: 'አማ', srLabel: 'Amharic' },
]

export function toLanguage(choice: LanguageChoice): Language | undefined {
  return choice === 'both' ? undefined : choice
}

export function fromLanguage(language: Language | undefined): LanguageChoice {
  return language ?? 'both'
}
