import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom implements no CSSOM view module, so matchMedia is missing entirely.
// Components that branch on a breakpoint need it to exist; they get a stub that
// reports "does not match", which is the mobile layout.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList
}

// jsdom has no layout, so scrollIntoView is not implemented either.
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// jsdom ships <dialog> without its modal methods. The stubs only need to track
// openness — the focus trap and top-layer behaviour are the browser's job, and
// what tests assert here is that the element is open, hidden, or interactive.
if (!window.HTMLDialogElement.prototype.showModal) {
  window.HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  window.HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}

afterEach(() => {
  cleanup()
  // Bookmarks, conversations and the theme all live here; a test that writes
  // must not change the next one's starting point.
  window.localStorage.clear()
})
