import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { jsonResponse, renderWithProviders } from '@/test/utils'
import { ExplorerPage } from './ExplorerPage'

/** The wire shape of one catalogue entry. */
function documentFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'doc-1',
    title: 'Commercial Code of Ethiopia',
    doc_type: 'code',
    legal_domain: 'commercial',
    issuing_authority: 'Federal Government',
    language: 'en',
    publication_date: '2021-03-30',
    effective_date: '2021-04-05',
    source_url: '',
    version: {
      id: 'ver-1',
      version_label: '2021',
      status: 'published',
      effective_from: '2021-04-05',
      repealed_at: null,
      published_at: '2026-08-14T09:00:00Z',
      article_count: 1193,
    },
    ...overrides,
  }
}

function stubList(body: unknown, status = 200) {
  const urls: string[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    urls.push(String(input))
    return jsonResponse(body, status)
  })
  vi.stubGlobal('fetch', fetchMock)
  return urls
}

describe('ExplorerPage', () => {
  it('lists what the catalogue returns', async () => {
    stubList({
      documents: [documentFixture(), documentFixture({ id: 'doc-2', title: 'Labour Proclamation', doc_type: 'proclamation' })],
      total: 2,
      limit: 24,
      offset: 0,
    })

    renderWithProviders(<ExplorerPage />)

    expect(await screen.findByText('Commercial Code of Ethiopia')).toBeInTheDocument()
    expect(screen.getByText('Labour Proclamation')).toBeInTheDocument()
    expect(screen.getAllByText('1,193 articles')).toHaveLength(2)
  })

  it('passes the URL filters to the API', async () => {
    const urls = stubList({ documents: [], total: 0, limit: 24, offset: 0 })

    renderWithProviders(<ExplorerPage />, {
      route: '/explorer?q=labour&lang=am&type=proclamation',
    })

    await screen.findByText(/Nothing matches those filters/)

    expect(urls[0]).toContain('q=labour')
    expect(urls[0]).toContain('language=am')
    expect(urls[0]).toContain('type=proclamation')
  })

  it('distinguishes an empty corpus from an over-filtered one', async () => {
    stubList({ documents: [], total: 0, limit: 24, offset: 0 })

    renderWithProviders(<ExplorerPage />)

    // No filters applied: this is "nothing has been ingested", which is a
    // different problem from "your filters match nothing".
    expect(await screen.findByText('The corpus is empty')).toBeInTheDocument()
  })

  it('offers a retry when the catalogue cannot be read', async () => {
    stubList({ error: { code: 'internal_error', message: 'Could not load.' } }, 500)

    renderWithProviders(<ExplorerPage />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})
