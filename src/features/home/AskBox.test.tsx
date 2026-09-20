import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthContext, type AuthStatus } from '@/lib/auth/context'
import { stubAuth } from '@/test/utils'
import { AskBox } from './AskBox'

/** Reports the URL the box navigated to, so the assertion is on the route. */
function Landed({ label }: { label: string }) {
  const { pathname, search } = useLocation()
  return <p data-testid={label}>{pathname + search}</p>
}

function renderAskBox(status: AuthStatus) {
  return render(
    <AuthContext.Provider value={stubAuth(status)}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AskBox />} />
          <Route path="/chat" element={<Landed label="chat" />} />
          <Route path="/signin" element={<Landed label="signin" />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

const QUESTION = 'How do I register a private limited company?'

describe('AskBox', () => {
  it('goes straight to the answer when signed in', async () => {
    const user = userEvent.setup()
    renderAskBox('signed-in')

    await user.type(screen.getByLabelText('Ask a legal question'), QUESTION)
    await user.keyboard('{Enter}')

    const landed = screen.getByTestId('chat').textContent ?? ''
    expect(landed).toContain('/chat')
    // Compare the decoded value: URLSearchParams encodes a space as '+', so
    // asserting on the raw string would be testing the encoder, not the flow.
    expect(new URLSearchParams(landed.split('?')[1]).get('q')).toBe(QUESTION)
  })

  // The flow this feature exists for: press Enter on the landing page, get
  // asked to sign in, and — critically — do not lose what you typed.
  it('sends a signed-out visitor to sign in, carrying the question', async () => {
    const user = userEvent.setup()
    renderAskBox('signed-out')

    await user.type(screen.getByLabelText('Ask a legal question'), QUESTION)
    await user.keyboard('{Enter}')

    const landed = screen.getByTestId('signin').textContent ?? ''
    expect(landed).toContain('/signin')

    // The `next` destination must be the fully-formed chat URL, so that after
    // Google returns the question is answered rather than retyped.
    const next = new URLSearchParams(landed.split('?').slice(1).join('?')).get('next')
    expect(next).toBeTruthy()
    expect(next).toContain('/chat')
    expect(new URLSearchParams(next!.split('?')[1]).get('q')).toBe(QUESTION)
  })

  it('does nothing on an empty question', async () => {
    const user = userEvent.setup()
    renderAskBox('signed-out')

    await user.click(screen.getByLabelText('Ask Seera'))

    expect(screen.queryByTestId('signin')).not.toBeInTheDocument()
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument()
  })

  // Pressing Enter before the session has restored must not be read as
  // "signed out" — that would send a signed-in user to the login screen for
  // being quick.
  it('waits while the session is still loading', async () => {
    const user = userEvent.setup()
    renderAskBox('loading')

    await user.type(screen.getByLabelText('Ask a legal question'), QUESTION)
    await user.keyboard('{Enter}')

    expect(screen.queryByTestId('signin')).not.toBeInTheDocument()
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument()
  })
})
