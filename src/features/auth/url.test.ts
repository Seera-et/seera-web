import { describe, expect, it } from 'vitest'
import { readNext, signInPath } from './url'

describe('signInPath', () => {
  it('carries the destination so a deep link survives the round trip', () => {
    expect(signInPath('/bookmarks')).toBe('/signin?next=%2Fbookmarks')
  })

  it('keeps the question when the destination is an ask', () => {
    const path = signInPath('/chat?q=how%20do%20I%20register')
    expect(readNext(new URLSearchParams(path.split('?').slice(1).join('?')))).toBe(
      '/chat?q=how%20do%20I%20register',
    )
  })

  it('stays bare for home, which needs no redirect back', () => {
    expect(signInPath('/')).toBe('/signin')
    expect(signInPath()).toBe('/signin')
  })
})

describe('readNext', () => {
  it('returns an in-site path', () => {
    expect(readNext(new URLSearchParams('next=/history'))).toBe('/history')
  })

  it('falls back when absent', () => {
    expect(readNext(new URLSearchParams(''))).toBe('/')
  })

  // `next` is attacker-controllable via a crafted link. Without these checks a
  // sign-in on seera.site would hand the freshly authenticated visitor to
  // someone else's site, with the address bar having said seera.site the whole
  // way — a textbook open redirect, and a convincing phishing primitive.
  it.each([
    ['absolute http', 'https://evil.example/login'],
    ['protocol-relative', '//evil.example'],
    ['backslash variant', '/\\evil.example'],
    ['javascript url', 'javascript:alert(1)'],
    ['bare word', 'evil.example'],
  ])('refuses an off-site destination: %s', (_name, value) => {
    const params = new URLSearchParams()
    params.set('next', value)
    expect(readNext(params)).toBe('/')
  })
})
