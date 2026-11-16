import { useSyncExternalStore } from 'react'

import type { Theme, ThemeStore } from '../theme.js'

export function useSyncTheme(store: ThemeStore, defaultTheme: Theme = 'system'): Theme {
  const getTheme = () => store.get() ?? defaultTheme

  return useSyncExternalStore(store.subscribe, getTheme, getTheme)
}
