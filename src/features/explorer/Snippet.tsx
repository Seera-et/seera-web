import { Fragment } from 'react'
import { splitSnippet } from './highlight'

/**
 * A search snippet with the matched terms marked.
 *
 * `<mark>` is the right element rather than a styled span: it is what "relevant
 * because the reader searched for it" means in HTML, and it is announced as
 * such.
 */
export function Snippet({
  snippet,
  lang,
  className,
}: {
  snippet: string
  lang?: string
  className?: string
}) {
  const parts = splitSnippet(snippet)

  return (
    <p className={className} lang={lang}>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part.match ? (
            <mark className="rounded bg-brand-100 px-0.5 text-ink dark:bg-brand-900/60 dark:text-ink">
              {part.text}
            </mark>
          ) : (
            part.text
          )}
        </Fragment>
      ))}
    </p>
  )
}
