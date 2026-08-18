import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { jsonResponse, renderWithProviders } from '@/test/utils'
import { CorpusStats } from './CorpusStats'

/**
 * The home page counters.
 *
 * These are a public claim about what the system can answer from, so the test
 * that matters is that they come from the API and that an empty corpus reads as
 * empty rather than as something reassuring.
 */

const STATS = {
  documents: 3,
  versions: 3,
  articles: 1193,
  chunks: 1420,
  languages: [
    { language: 'en', documents: 2, articles: 900 },
    { language: 'am', documents: 1, articles: 293 },
  ],
  doc_types: [{ doc_type: 'code', documents: 3 }],
  last_published_at: '2026-08-14T09:00:00Z',
}

describe('CorpusStats', () => {
  it('renders the counts the API reports', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(STATS)))

    renderWithProviders(<CorpusStats />)

    expect(await screen.findByText('1,193')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    // The Amharic split, taken from the language breakdown rather than guessed.
    expect(screen.getByText('293')).toBeInTheDocument()
    expect(screen.getByText('14 Aug 2026')).toBeInTheDocument()
  })

  it('says plainly when the corpus is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          documents: 0,
          versions: 0,
          articles: 0,
          chunks: 0,
          languages: [],
          doc_types: [],
          last_published_at: null,
        }),
      ),
    )

    renderWithProviders(<CorpusStats />)

    expect(await screen.findByText(/Nothing is published yet/)).toBeInTheDocument()
    // No invented figures, and no dash pretending to be a number.
    expect(screen.getAllByText('0').length).toBeGreaterThan(0)
  })

  it('offers a retry when the stats endpoint fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          { error: { code: 'internal_error', message: 'Could not read the corpus.' } },
          500,
        ),
      ),
    )

    renderWithProviders(<CorpusStats />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
