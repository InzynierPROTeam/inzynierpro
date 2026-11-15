import { getCookie, setCookie, type CookieOptions } from '@inzpro/browser-utils/cookie'
import { Duration } from 'effect'

export type ResolvedTheme = 'light' | 'dark'

export type Theme = ResolvedTheme | 'system'

export const THEME_KEY = 'theme'

export const readTheme = (value: string | null | undefined): Theme | null => {
  switch (value) {
    case 'light':
    case 'dark':
    case 'system':
      return value
    default:
      return null
  }
}

export type ThemeCookies = {
  get: (name: string) => string | null | undefined
  set: (name: string, value: string, options?: CookieOptions) => void
}

// Browser-only by default; pass request-aware cookies so the server renders the saved theme.
const browserCookies: ThemeCookies = { get: getCookie, set: setCookie }

export const createThemeStore = (
  storageKey: string = THEME_KEY,
  cookies: ThemeCookies = browserCookies,
) => {
  const eventName = `${storageKey}:change`

  return {
    get: () => readTheme(cookies.get(storageKey)),
    set: (theme: Theme) => {
      cookies.set(storageKey, theme, {
        maxAge: Duration.days(365),
      })
      window.dispatchEvent(new Event(eventName))
    },
    subscribe: (callback: VoidFunction) => {
      window.addEventListener(eventName, callback)

      return () => window.removeEventListener(eventName, callback)
    },
  }
}

export type ThemeStore = ReturnType<typeof createThemeStore>
