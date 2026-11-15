import { useSyncResolvedTheme } from '@inzpro/react-utils/hooks/use-sync-resolved-theme'
import { useSyncTheme } from '@inzpro/react-utils/hooks/use-sync-theme'
import {
  createThemeStore,
  THEME_KEY,
  type Theme,
  type ThemeCookies,
  type ResolvedTheme,
} from '@inzpro/react-utils/theme'
import { createContext, use, useEffect, useMemo, type PropsWithChildren } from 'react'
import { FunctionOnce } from '~ui/side-effects/function-once.js'

type ThemeContext = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContext | null>(null)

type ThemeProviderProps = PropsWithChildren<{
  defaultTheme?: Theme
  storageKey?: string
  cookies?: ThemeCookies
}>

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = THEME_KEY,
  cookies,
}: ThemeProviderProps) {
  const store = useMemo(() => createThemeStore(storageKey, cookies), [storageKey, cookies])
  const theme = useSyncTheme(store, defaultTheme)
  const resolvedTheme = useSyncResolvedTheme(theme)

  useEffect(() => {
    // The server cannot know the system scheme, so `resolvedTheme` is light during hydration.
    // Resolve it from the media query here so hydration does not switch a dark page to light.
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme

    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    root.dataset.theme = theme
  }, [theme, resolvedTheme])

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme: store.set }),
    [theme, resolvedTheme, store],
  )

  return (
    <ThemeContext value={value}>
      <FunctionOnce param={storageKey}>
        {(storageKey: string) => {
          function getCookieValue(key: string): string | null {
            const cookies = document.cookie.split(';')

            for (const cookie of cookies) {
              const [name, value] = cookie.trim().split('=')

              if (name === key && value) {
                return decodeURIComponent(value)
              }
            }

            return null
          }

          const saved = getCookieValue(storageKey)
          const theme = saved === 'light' || saved === 'dark' ? saved : 'system'

          const resolved =
            theme === 'system'
              ? window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
              : theme

          const root = document.documentElement

          root.classList.add(resolved)
          root.setAttribute('data-theme', theme)
        }}
      </FunctionOnce>
      {children}
    </ThemeContext>
  )
}

export function useTheme() {
  const context = use(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
