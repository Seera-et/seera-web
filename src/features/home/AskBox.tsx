import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Paperclip, SendHorizontal } from 'lucide-react'
import { Button } from '@/components/ui'
import { LanguagePicker } from '@/features/qa/LanguagePicker'
import { toLanguage, type LanguageChoice } from '@/features/qa/language'
import { chatPath } from '@/features/qa/url'
import { signInPath } from '@/features/auth/url'
import { useAuth } from '@/lib/auth/useAuth'
import { cn } from '@/lib/utils/cn'

/**
 * The hero's ask field. It does not answer anything itself: it navigates to
 * /chat with the question in the URL, and the chat page owns the request. That
 * keeps one code path for asking, and makes the resulting answer shareable.
 *
 * The box stays usable when signed out — it is the main thing the landing page
 * invites you to do, and hiding it behind a login would leave the home page
 * with nothing to offer. Asking is what needs an account, so the gate is on
 * submit.
 */
export function AskBox() {
  const navigate = useNavigate()
  const { status } = useAuth()
  const [question, setQuestion] = useState('')
  const [choice, setChoice] = useState<LanguageChoice>('both')

  const trimmed = question.trim()

  function submit() {
    if (!trimmed) return

    const destination = chatPath({ question: trimmed, language: toLanguage(choice) })

    // The question is already encoded into `destination`, so routing through
    // sign-in carries it out to Google and back: the visitor returns to /chat
    // with what they typed, and it answers. Losing the question here — making
    // someone retype it after signing in — is the whole reason this is a
    // redirect with state rather than a modal.
    //
    // 'loading' waits: treating an unrestored session as signed out would send
    // a signed-in user to the login screen for pressing Enter too quickly.
    if (status === 'signed-out') {
      navigate(signInPath(destination))
      return
    }
    if (status === 'loading') return

    navigate(destination)
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
          disabled={!trimmed || status === 'loading'}
          aria-label="Ask Seera"
          className="size-10"
        >
          <SendHorizontal />
        </Button>
      </div>
    </form>
  )
}
