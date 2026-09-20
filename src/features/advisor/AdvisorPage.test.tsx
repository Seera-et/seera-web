import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jsonResponse, renderWithProviders } from '@/test/utils'
import { AdvisorPage } from './AdvisorPage'

function source(article: string, overrides: Record<string, unknown> = {}) {
  return {
    document_id: 'doc-1',
    document_title: 'Commercial Code of Ethiopia (Proclamation No. 1243/2021)',
    article_no: article,
    pinpoint: null,
    facet: 'general',
    chunk_id: 'chunk-1',
    article_title: 'Definition',
    text: 'A private limited company may not have less than two or more than fifty members.',
    ...overrides,
  }
}

function structure(overrides: Record<string, unknown> = {}) {
  return {
    code: 'plc',
    name: 'Private limited company',
    name_suffix: 'Private Limited Company',
    summary: 'Capital fully paid in advance and divided into shares.',
    liability: 'limited',
    min_members: 2,
    max_members: 50,
    min_capital: 15000,
    min_share_par: 100,
    currency: 'ETB',
    allows_public_subscription: false,
    sources: [source('495', { pinpoint: '495/4', facet: 'members' })],
    ...overrides,
  }
}

const INTAKE = {
  rule_set_id: 'set-1',
  rule_set_label: 'commercial-code-1243-2021-v1',
  activities: [
    { code: 'retail_wholesale', name: 'Retail and wholesale', regulated: false, sources: [source('5')] },
    { code: 'financial_services', name: 'Financial services', regulated: true, sources: [source('5')] },
  ],
  structures: [structure()],
  unsupported: ['Foreign ownership rules: no investment legislation is indexed.'],
}

function recommendation(overrides: Record<string, unknown> = {}) {
  return {
    rule_set_id: 'set-1',
    rule_set_label: 'commercial-code-1243-2021-v1',
    recommended: {
      structure: structure(),
      eligible: true,
      reasons: [
        {
          code: 'members_within_range',
          message: 'Private limited company suits 2 founders.',
          disqualifying: false,
          sources: [source('495', { pinpoint: '495/4', facet: 'members' })],
        },
      ],
    },
    alternatives: [],
    excluded: [
      {
        structure: structure({ code: 'one_person_plc', name: 'One person private limited company' }),
        eligible: false,
        reasons: [
          {
            code: 'members_above_maximum',
            message:
              'One person private limited company may not have more than 1 founder, and you have 2 founders.',
            disqualifying: true,
            sources: [source('534')],
          },
        ],
      },
    ],
    steps: [
      {
        kind: 'step',
        structure_code: null,
        activity_code: null,
        title: 'Register in the commercial register',
        detail: 'Business organizations acquire legal personality on registration.',
        authority: 'Ministry of Trade and Industry',
        sources: [source('175')],
      },
    ],
    licences: [],
    caveats: [
      {
        kind: 'caveat',
        structure_code: null,
        activity_code: null,
        title: 'This is legal information, not legal advice',
        detail: 'Consult a qualified Ethiopian legal professional.',
        authority: null,
        sources: [],
      },
    ],
    unsupported: [],
    ...overrides,
  }
}

/** Routes by path so the intake and the recommendation get their own schemas. */
function stub(options: { intake?: unknown; intakeStatus?: number; advice?: unknown } = {}) {
  const bodies: string[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.includes('/business/intake')) {
      return jsonResponse(options.intake ?? INTAKE, options.intakeStatus ?? 200)
    }
    if (url.includes('/business/advisor')) {
      if (init?.body) bodies.push(String(init.body))
      return jsonResponse(options.advice ?? recommendation())
    }
    return jsonResponse({})
  })
  vi.stubGlobal('fetch', fetchMock)
  return bodies
}

async function answerFoundersAndSubmit(count: string) {
  const input = await screen.findByLabelText('Number of owners')
  await userEvent.clear(input)
  await userEvent.type(input, count)
  await userEvent.click(screen.getByRole('button', { name: /Get recommendation/ }))
}

describe('AdvisorPage', () => {
  it('asks the founder count first and blocks until it is answered', async () => {
    stub()
    renderWithProviders(<AdvisorPage />)

    expect(
      await screen.findByText('How many people will own the business?'),
    ).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 6')).toBeInTheDocument()
    // The single required answer: nothing can be recommended without it.
    expect(screen.getByRole('button', { name: /Get recommendation/ })).toBeDisabled()
  })

  it('recommends a structure and cites the provision behind each reason', async () => {
    stub()
    renderWithProviders(<AdvisorPage />)
    await answerFoundersAndSubmit('2')

    expect(
      await screen.findByRole('heading', { name: 'Private limited company' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Private limited company suits 2 founders.'),
    ).toBeInTheDocument()

    // The citation is collapsed; opening it shows the article's own words.
    await userEvent.click(screen.getAllByRole('button', { name: /1 provision/ })[0])
    expect(screen.getAllByText(/Article 495\/4/).length).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/may not have less than two or more than fifty members/)[0],
    ).toBeInTheDocument()
  })

  it('shows a bound the corpus does not establish as unstated, not as no limit', async () => {
    stub({
      advice: recommendation({
        recommended: {
          structure: structure({
            code: 'share_company',
            name: 'Share company',
            min_members: null,
            max_members: null,
            min_capital: null,
          }),
          eligible: true,
          reasons: [
            {
              code: 'member_limit_unknown',
              message: 'The indexed corpus does not state how many members Share company requires.',
              disqualifying: false,
              sources: [source('174')],
            },
          ],
        },
      }),
    })
    renderWithProviders(<AdvisorPage />)
    await answerFoundersAndSubmit('5')

    await screen.findByRole('heading', { name: 'Share company' })
    // "Not stated" is a different claim from "no limit", and only one is true.
    expect(
      screen.getAllByText(/Not stated in the indexed corpus/).length,
    ).toBeGreaterThan(0)
  })

  it('explains why a form was ruled out', async () => {
    stub()
    renderWithProviders(<AdvisorPage />)
    await answerFoundersAndSubmit('2')

    expect(await screen.findByText('Ruled out, and why')).toBeInTheDocument()
    expect(
      screen.getByText(/One person private limited company may not have more than 1 founder/),
    ).toBeInTheDocument()
  })

  it('says an empty licence list is missing information, not permission', async () => {
    stub()
    renderWithProviders(<AdvisorPage />)
    await answerFoundersAndSubmit('2')

    expect(await screen.findByText('Licences')).toBeInTheDocument()
    expect(
      screen.getByText(/That means none could be cited — not that none applies/),
    ).toBeInTheDocument()
  })

  it('states the corpus gaps before the reader answers anything', async () => {
    stub()
    renderWithProviders(<AdvisorPage />)

    expect(
      await screen.findByText('What this advisor cannot tell you'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/no investment legislation is indexed/),
    ).toBeInTheDocument()
  })

  it('omits unanswered questions from the request rather than sending a default', async () => {
    const bodies = stub()
    renderWithProviders(<AdvisorPage />)
    await answerFoundersAndSubmit('3')

    await screen.findByRole('heading', { name: 'Private limited company' })

    expect(bodies).toHaveLength(1)
    const sent = JSON.parse(bodies[0]) as Record<string, unknown>
    expect(sent).toEqual({ founders: 3 })
    // Sending false for an unanswered preference would be inventing an answer.
    expect(sent).not.toHaveProperty('wants_limited_liability')
    expect(sent).not.toHaveProperty('capital_birr')
  })

  it('sends the optional answers that were given', async () => {
    const bodies = stub()
    renderWithProviders(<AdvisorPage />)

    const founders = await screen.findByLabelText('Number of owners')
    await userEvent.clear(founders)
    await userEvent.type(founders, '2')

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await userEvent.selectOptions(
      screen.getByLabelText('Main activity'),
      'financial_services',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await userEvent.type(screen.getByLabelText('Capital available (ETB)'), '40000')
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Yes' }))

    await userEvent.click(screen.getByRole('button', { name: /Get recommendation/ }))
    await screen.findByRole('heading', { name: 'Private limited company' })

    const sent = JSON.parse(bodies[0]) as Record<string, unknown>
    expect(sent).toMatchObject({
      founders: 2,
      activity_code: 'financial_services',
      capital_birr: 40000,
      wants_limited_liability: true,
    })
  })

  it('reports a deployment with no rule set as exactly that', async () => {
    // A 503 the reader cannot fix by retrying: the feature works, this
    // deployment has no rules loaded.
    stub({
      intake: { error: { code: 'no_rule_set', message: 'No published rule set.' } },
      intakeStatus: 503,
    })
    renderWithProviders(<AdvisorPage />)

    expect(
      await screen.findByText('The advisor has no rule set loaded'),
    ).toBeInTheDocument()
  })

  it('answers that nothing fits when every form is ruled out', async () => {
    stub({ advice: recommendation({ recommended: null }) })
    renderWithProviders(<AdvisorPage />)
    await answerFoundersAndSubmit('2')

    expect(
      await screen.findByText('No legal form fits those answers'),
    ).toBeInTheDocument()
  })

  it('lets the reader start over', async () => {
    stub()
    renderWithProviders(<AdvisorPage />)
    await answerFoundersAndSubmit('2')

    await screen.findByRole('heading', { name: 'Private limited company' })
    await userEvent.click(screen.getByRole('button', { name: /Start again/ }))

    expect(
      await screen.findByText('How many people will own the business?'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Number of owners')).toHaveValue(null)
  })
})
