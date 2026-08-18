import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { Button } from './Button'
import { Drawer } from './Drawer'

/**
 * Regression: a closed Drawer made the whole page unclickable.
 *
 * `<dialog>` is hidden by a user-agent rule, and an author `display` beats the
 * UA origin — so a `flex` class on the element left it laid out at inset-0 as an
 * invisible overlay over everything. The chat composer and every button under it
 * stopped responding, with nothing visible to explain why.
 */
describe('Drawer', () => {
  function setup(open: boolean) {
    return renderWithProviders(
      <>
        <Button onClick={vi.fn()}>Underneath</Button>
        <Drawer open={open} onClose={vi.fn()} title="Source">
          <p>Panel content</p>
        </Drawer>
      </>,
    )
  }

  it('does not lay itself out when closed', () => {
    const { container } = setup(false)
    const dialog = container.querySelector('dialog')

    expect(dialog).not.toBeNull()
    // Explicitly display:none, rather than relying on the UA rule that an
    // author class can override.
    expect(dialog).toHaveClass('hidden')
    expect(dialog).not.toHaveClass('flex')
  })

  it('leaves the page interactive while it is closed', async () => {
    const onClick = vi.fn()
    renderWithProviders(
      <>
        <Button onClick={onClick}>Underneath</Button>
        <Drawer open={false} onClose={vi.fn()} title="Source">
          <p>Panel content</p>
        </Drawer>
      </>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Underneath' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders its content only when open', () => {
    setup(false)
    expect(screen.queryByText('Panel content')).not.toBeInTheDocument()

    setup(true)
    expect(screen.getByText('Panel content')).toBeInTheDocument()
  })

  it('lays out as a flex container when open', () => {
    const { container } = setup(true)
    expect(container.querySelector('dialog')).toHaveClass('flex')
  })
})
