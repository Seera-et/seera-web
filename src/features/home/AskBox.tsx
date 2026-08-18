import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Paperclip, SendHorizontal } from 'lucide-react'
import { Button } from '@/components/ui'
import { LanguagePicker } from '@/features/qa/LanguagePicker'
import { toLanguage, type LanguageChoice } from '@/features/qa/language'
import { chatPath } from '@/features/qa/url'
import { cn } from '@/lib/utils/cn'

/**
 * The hero's ask field. It does not answer anything itself: it navigates to
 * /chat with the question in the URL, and the chat page owns the request. That
 * keeps one code path for asking, and makes the resulting answer shareable.
 */
export function AskBox() {
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [choice, setChoice] = useState<LanguageChoice>('both')

  const trimmed = question.trim()

  function submit() {
    if (!trimmed) return
    navigate(chatPath({ question: trimmed, language: toLanguage(choice) }))
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className={cn(
        'flex flex-col gap-3 rounded-card border border-line bg-surface p-2.5',
        'shadow-card sm:flex-row sm:items-center',
      )}
    >
      <label htmlFor="hero-question" className="sr-only">
        Ask a legal question
      </label>
      <input
        id="hero-question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Ask a legal question…"
        autoComplete="off"
        className={cn(
          'min-w-0 flex-1 bg-transparent px-2.5 py-2 text-[0.95rem] text-ink',
          'placeholder:text-ink-muted focus:outline-none',
        )}
      />

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled
          aria-label="Attach a document (not available yet)"
          title="Document upload is not available yet"
        >
          <Paperclip />
        </Button>
        <LanguagePicker value={choice} onChange={setChoice} />
        <Button
          type="submit"
          size="icon"
          disabled={!trimmed}
          aria-label="Ask Seera"
          className="size-10"
        >
          <SendHorizontal />
        </Button>
      </div>
    </form>
  )
}
