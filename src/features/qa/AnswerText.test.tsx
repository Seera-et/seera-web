import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import type { AnswerCitation } from '@/lib/api'
import { AnswerText } from './AnswerText'

/**
 * The citation surface. What is being protected here is the rule that a marker
 * only becomes a source when the structured citations array vouches for it — a
 * bracket in the text is not evidence of anything.
 */

function citation(overrides: Partial<AnswerCitation> = {}): AnswerCitation {
  return {
    marker: 'S1',
    chunkId: 'chunk-1',
    articleId: 'article-1',
    versionId: 'version-1',
    documentId: 'document-1',
    documentTitle: 'Commercial Code',
    issuingAuthority: null,
    articleNo: '627',
    articleTitle: null,
    sectionPath: [],
    language: 'en',
    effectiveFrom: '2021-04-05',
    text: 'A private limited company may be formed by two or more persons.',
    structureConfidence: 'high',
    ...overrides,
  }
}

describe('AnswerText', () => {
  it('renders a marker as a labelled button, not a bare number', () => {
    renderWithProviders(
      <AnswerText
        text="A company may be formed by two persons [S1]."
        citations={[citation()]}
        onOpenSource={vi.fn()}
      />,
    )

    const marker = screen.getByRole('button', {
      name: 'Source 1: Commercial Code, Article 627',
    })
    expect(marker).toHaveTextContent('1')
  })

  it('opens the source panel with the chunk id behind the marker', async () => {
    const onOpenSource = vi.fn()
    renderWithProviders(
      <AnswerText
        text="Formed by two persons [S1]."
        citations={[citation({ chunkId: 'chunk-42' })]}
        onOpenSource={onOpenSource}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /Source 1/ }))
    expect(onOpenSource).toHaveBeenCalledWith('chunk-42')
  })

  it('renders each member of a grouped marker', () => {
    renderWithProviders(
      <AnswerText
        text="Both provisions apply [S1, S2]."
        citations={[
          citation(),
          citation({ marker: 'S2', chunkId: 'chunk-2', articleNo: '628' }),
        ]}
        onOpenSource={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /Source 1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Source 2/ })).toBeInTheDocument()
  })

  it('leaves a marker with no matching citation as plain text', () => {
    // The model wrote [S4]; nothing in this request's context backs it. It must
    // not become a clickable source.
    renderWithProviders(
      <AnswerText
        text="A claim with no evidence [S4]."
        citations={[citation()]}
        onOpenSource={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText(/\[S4\]/)).toBeInTheDocument()
  })

  it('does not treat bracketed prose as a citation', () => {
    renderWithProviders(
      <AnswerText
        text="See [the schedule] and [Article 5]."
        citations={[citation()]}
        onOpenSource={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the source snippet on hover', async () => {
    renderWithProviders(
      <AnswerText
        text="Formed by two persons [S1]."
        citations={[citation()]}
        onOpenSource={vi.fn()}
      />,
    )

    await userEvent.hover(screen.getByRole('button', { name: /Source 1/ }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'A private limited company may be formed by two or more persons.',
    )
  })

  it('marks Amharic answers so Ethiopic renders and screen readers switch voice', () => {
    const { container } = renderWithProviders(
      <AnswerText
        text="የንግድ ማኅበር ሊቋቋም ይችላል።"
        citations={[]}
        onOpenSource={vi.fn()}
      />,
    )

    expect(container.querySelector('[lang="am"]')).toBeInTheDocument()
  })

  it('renders a bullet block as a list', () => {
    renderWithProviders(
      <AnswerText
        text={'What might help:\n\n- naming the law\n- citing an article'}
        citations={[]}
        onOpenSource={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})

/**
 * The shape a real answer arrives in: markdown headings, bold labels, bullets,
 * and markers the model sometimes decorates with an article number.
 */
describe('AnswerText with a real answer', () => {
  const ANSWER = [
    '### 1. Share Company',
    '* **Registration**: A share company must be registered [S1, Art. 265(1)].',
    '* **Documents**: An authenticated memorandum is required [S1].',
  ].join('\n')

  it('renders headings as headings, not as hashes', () => {
    renderWithProviders(
      <AnswerText text={ANSWER} citations={[citation()]} onOpenSource={vi.fn()} />,
    )

    expect(
      screen.getByRole('heading', { name: '1. Share Company' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/###/)).not.toBeInTheDocument()
  })

  it('renders bold labels as emphasis, not as asterisks', () => {
    const { container } = renderWithProviders(
      <AnswerText text={ANSWER} citations={[citation()]} onOpenSource={vi.fn()} />,
    )

    expect(container.querySelectorAll('strong')).toHaveLength(2)
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument()
  })

  it('makes a decorated marker clickable and hides the model-written article', () => {
    renderWithProviders(
      <AnswerText text={ANSWER} citations={[citation()]} onOpenSource={vi.fn()} />,
    )

    // Two markers, both resolving to the one source in the citations array.
    expect(screen.getAllByRole('button', { name: /Source 1/ })).toHaveLength(2)
    // The article number the reader sees comes from the record, not from the
    // string the model typed inside the brackets.
    expect(screen.queryByText(/Art\. 265\(1\)/)).not.toBeInTheDocument()
  })

  it('renders each bullet as a list item', () => {
    renderWithProviders(
      <AnswerText text={ANSWER} citations={[citation()]} onOpenSource={vi.fn()} />,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
