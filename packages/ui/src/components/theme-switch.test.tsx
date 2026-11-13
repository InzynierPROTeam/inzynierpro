import { createRootRoute, createRouter, RouterContextProvider } from '@tanstack/react-router'
import { act } from 'react'
import { afterEach, expect, test } from 'vitest'
import { ThemeProvider } from '~ui/providers/theme-provider.js'
import { render } from '~ui/test/render.js'

import { ThemeSwitchButton } from './theme-switch.js'

afterEach(() => {
  document.cookie = 'theme=; Max-Age=0; path=/'
  document.documentElement.className = ''
  delete document.documentElement.dataset.theme
})

test('each press moves to the next theme: light, dark, system and back to light', async () => {
  document.cookie = 'theme=light; path=/'

  const router = createRouter({ routeTree: createRootRoute(), isServer: false })

  const container = await render(
    <RouterContextProvider router={router}>
      <ThemeProvider>
        <ThemeSwitchButton />
      </ThemeProvider>
    </RouterContextProvider>,
  )

  const toggle = container.querySelector<HTMLButtonElement>('button[aria-label="Przełącz motyw"]')
  const seen = [document.documentElement.dataset.theme]

  for (let press = 0; press < 3; press++) {
    await act(async () => toggle?.click())
    seen.push(document.documentElement.dataset.theme)
  }

  expect(seen).toEqual(['light', 'dark', 'system', 'light'])
  expect(document.cookie).toContain('theme=light')
})
