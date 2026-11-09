import { createRootRoute, createRouter, RouterContextProvider } from '@tanstack/react-router'
import { JSDOM } from 'jsdom'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test } from 'vitest'
import { ThemeSwitchButton } from '~ui/components/theme-switch.js'

import { ThemeProvider } from './theme-provider.js'

Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true })

window.matchMedia = query => ({
  matches: false,
  media: query,
  onchange: null,
  // oxlint-disable-next-line typescript/no-deprecated -- Required legacy member of the MediaQueryList test double.
  addListener() {},
  // oxlint-disable-next-line typescript/no-deprecated -- Required legacy member of the MediaQueryList test double.
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => true,
})

afterEach(() => {
  document.cookie = 'theme=; Max-Age=0; path=/'
  document.documentElement.className = ''
  delete document.documentElement.dataset.theme
  document.body.innerHTML = ''
})

test('hydrates without mismatches, restores the saved theme and persists changes', async () => {
  document.cookie = 'theme=dark; path=/'

  const router = createRouter({ routeTree: createRootRoute(), isServer: false })

  const app = (
    <RouterContextProvider router={router}>
      <ThemeProvider>
        <ThemeSwitchButton />
      </ThemeProvider>
    </RouterContextProvider>
  )

  const container = document.createElement('div')
  container.innerHTML = renderToString(app)
  document.body.append(container)
  const errors: Error[] = []

  const root = hydrateRoot(container, app, {
    onRecoverableError: error => {
      errors.push(error instanceof Error ? error : new Error(String(error)))
    },
  })

  try {
    await act(async () => {})
    expect(errors).toEqual([])
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    const button = container.querySelector('button')
    expect(button).not.toBeNull()

    await act(async () => button?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(document.documentElement.dataset.theme).toBe('system')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.cookie).toContain('theme=system')
  } finally {
    await act(async () => root.unmount())
  }
})

test('initializes the saved theme through a server-rendered one-time script', () => {
  const router = createRouter({ routeTree: createRootRoute(), isServer: true })

  const html = renderToString(
    <RouterContextProvider router={router}>
      <ThemeProvider>
        <span>Content</span>
      </ThemeProvider>
    </RouterContextProvider>,
  )

  const dom = new JSDOM(html, {
    url: 'https://example.com',
    runScripts: 'dangerously',
    beforeParse(window) {
      window.document.cookie = 'theme=dark; path=/'
    },
  })

  try {
    expect(dom.window.document.documentElement.classList.contains('dark')).toBe(true)
    expect(dom.window.document.querySelectorAll('script:not([src])')).toHaveLength(0)
  } finally {
    dom.window.close()
  }
})
