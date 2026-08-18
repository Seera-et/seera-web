import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  ThemeContext,
  type ResolvedTheme,
  type ThemeSetting,
} from './theme-context'

const STORAGE_KEY = 'seera.theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Theme is genuinely cross-cutting, which is what a context is for. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [setting, setSetting] = useLocalStorage<ThemeSetting>(STORAGE_KEY, 'system')
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light',
  )

  useEffect(() => {
    const list = window.matchMedia(DARK_QUERY)
    const onChange = (event: MediaQueryListEvent) =>
      setSystemTheme(event.matches ? 'dark' : 'light')
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [])

  const resolved: ResolvedTheme = setting === 'system' ? systemTheme : setting

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.classList.toggle('light', resolved === 'light')
  }, [resolved])

  const toggle = useCallback(() => {
    setSetting(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setSetting])

  return (
    <ThemeContext.Provider value={{ setting, resolved, setSetting, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
