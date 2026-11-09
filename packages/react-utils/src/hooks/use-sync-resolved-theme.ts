import { useSyncExternalStore } from 'react'

import type { ResolvedTheme, Theme } from '../theme.js'

const subscribe = (callback: VoidFunction) => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', callback)

  return () => media.removeEventListener('change', callback)
}

export function useSyncResolvedTheme(theme: Theme): ResolvedTheme {
  const systemTheme = useSyncExternalStore(
    subscribe,
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
    () => false,
  )

  return theme === 'system' ? (systemTheme ? 'dark' : 'light') : theme
}
