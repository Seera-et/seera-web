import { useEffect, useRef, useState } from 'react'
import { CalendarDays, SendHorizontal, Square } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { LanguagePicker } from './LanguagePicker'
import { fromLanguage, toLanguage, type LanguageChoice } from './language'
import type { ChatQuery } from './url'

/** Matches `maxQuestionRunes` in the Go handler, so the client rejects first. */
const MAX_LENGTH = 2000

export function Composer({
  busy,
  followUp = false,
  defaults,
  onSubmit,
  onCancel,
}: {
  busy: boolean
  /** True once the thread has a turn, which changes only the placeholder. */
  followUp?: boolean
  /** Seeds the controls from the URL so a shared link keeps its filters. */
  defaults: Pick<ChatQuery, 'language' | 'asOf'>
  onSubmit: (query: ChatQuery) => void
  onCancel: () => void
}) {
  const [question, setQuestion] = useState('')
  const [choice, setChoice] = useState<LanguageChoice>(fromLanguage(defaults.language))
  const [asOf, setAsOf] = useState(defaults.asOf ?? '')
  const [showAsOf, setShowAsOf] = useState(Boolean(defaults.asOf))
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Grows with the question instead of scrolling a three-line box.
  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`
  }, [question])

  const trimmed = question.trim()
  const tooLong = trimmed.length > MAX_LENGTH

  function submit() {
    if (!trimmed || tooLong || busy) return
    onSubmit({ question: trimmed, language: toLanguage(choice), asOf: asOf || undefined })
    setQuestion('')
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="rounded-card border border-line bg-surface p-2.5 shadow-card"
    >
      <label htmlFor="chat-question" className="sr-only">
        Ask a legal question
      </label>
      <textarea
        id="chat-question"
        ref={textareaRef}
        rows={1}
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={(event) => {
          // Enter sends; Shift+Enter is a newline, which a multi-part question needs.
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
        placeholder={
          followUp
            ? 'Ask a follow-up — "what about for a PLC?"'
            : 'Ask a legal question…'
        }
        aria-describedby="composer-hint"
        className={cn(
          'w-full resize-none bg-transparent px-2.5 py-2 text-[0.95rem] leading-relaxed',
          'text-ink placeholder:text-ink-muted focus:outline-none',
        )}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <LanguagePicker value={choice} onChange={setChoice} />
          <Button
            variant={showAsOf ? 'subtle' : 'ghost'}
            size="icon-sm"
            onClick={() => {
              setShowAsOf((value) => !value)
              if (showAsOf) setAsOf('')
            }}
            aria-pressed={showAsOf}
            aria-label="Ask what the law was on a specific date"
            title="Ask what the law was on a specific date"
          >
            <CalendarDays />
          </Button>
          {showAsOf ? (
            <span className="flex items-center gap-1.5">
              <label htmlFor="chat-as-of" className="text-xs text-ink-muted">
                As of
              </label>
              <input
                id="chat-as-of"
                type="date"
                value={asOf}
                onChange={(event) => setAsOf(event.target.value)}
                className="h-9 rounded-control border border-line bg-surface px-2 text-xs text-ink focus:border-brand-400 focus:outline-none"
              />
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span
            id="composer-hint"
            className={cn(
              'text-xs',
              tooLong ? 'text-danger-700 dark:text-danger-500' : 'text-ink-muted',
            )}
          >
            {tooLong
              ? `${trimmed.length} / ${MAX_LENGTH} characters`
              : 'Enter to send · Shift+Enter for a new line'}
          </span>

          {busy ? (
            <Button variant="secondary" size="icon" onClick={onCancel} aria-label="Stop">
              <Square />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!trimmed || tooLong}
              aria-label="Send question"
            >
              <SendHorizontal />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
