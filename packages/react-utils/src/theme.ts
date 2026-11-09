import { getCookie, setCookie } from '@inzpro/browser-utils/cookie'

export type ResolvedTheme = 'light' | 'dark'

export type Theme = ResolvedTheme | 'system'

export const THEME_KEY = 'theme'

export const readTheme = (value: string | null): Theme | null => {
  switch (value) {
    case 'light':
    case 'dark':
    case 'system':
      return value
    default:
      return null
  }
}

export const createThemeStore = (storageKey: string = THEME_KEY) => {
  const eventName = `${storageKey}:change`

  return {
    get: () => readTheme(getCookie(storageKey)),
    set: (theme: Theme) => {
      setCookie(storageKey, theme, {
        expires: 365,
        sameSite: 'lax',
        secure: window.location.protocol === 'https:',
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
