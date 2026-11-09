import { useSyncResolvedTheme } from '@inzpro/react-utils/hooks/use-sync-resolved-theme'
import { useSyncTheme } from '@inzpro/react-utils/hooks/use-sync-theme'
import {
  createThemeStore,
  THEME_KEY,
  type Theme,
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
}>

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = THEME_KEY,
}: ThemeProviderProps) {
  const store = useMemo(() => createThemeStore(storageKey), [storageKey])
  const theme = useSyncTheme(store, defaultTheme)
  const resolvedTheme = useSyncResolvedTheme(theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
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

          const theme = getCookieValue(storageKey)

          if (
            theme === 'dark' ||
            ((theme === null || theme === 'system') &&
              window.matchMedia('(prefers-color-scheme: dark)').matches)
          ) {
            document.documentElement.classList.add('dark')
          }
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
