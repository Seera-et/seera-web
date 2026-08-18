import { createContext, useContext } from 'react'

/** What the user chose. `system` follows the OS. */
export type ThemeSetting = 'light' | 'dark' | 'system'
/** What is actually on screen once `system` is resolved. */
export type ResolvedTheme = 'light' | 'dark'

export type ThemeContextValue = {
  setting: ThemeSetting
  resolved: ResolvedTheme
  setSetting: (setting: ThemeSetting) => void
  /** Flips between light and dark, leaving `system` behind deliberately. */
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>')
  return value
}
