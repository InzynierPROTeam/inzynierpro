import { createRootRoute, createRouter, RouterContextProvider } from '@tanstack/react-router'
import { JSDOM } from 'jsdom'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { ThemeSwitchButton } from '~ui/components/theme-switch.js'

import { ThemeProvider } from './theme-provider.js'

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
    expect(dom.window.document.documentElement.dataset.theme).toBe('dark')
    expect(dom.window.document.querySelectorAll('script:not([src])')).toHaveLength(0)
  } finally {
    dom.window.close()
  }
})

test('hydrating a system theme on a dark device never switches the page to light', async () => {
  const lightMatchMedia = window.matchMedia

  const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(query => {
    const media = lightMatchMedia(query)
    Object.defineProperty(media, 'matches', { value: true })

    return media
  })

  document.cookie = 'theme=system; path=/'
  document.documentElement.classList.add('dark')
  document.documentElement.dataset.theme = 'system'

  const router = createRouter({ routeTree: createRootRoute(), isServer: false })

  const app = (
    <RouterContextProvider router={router}>
      <ThemeProvider>
        <span>Content</span>
      </ThemeProvider>
    </RouterContextProvider>
  )

  const container = document.createElement('div')
  container.innerHTML = renderToString(app)
  document.body.append(container)
  const records: MutationRecord[] = []
  const observer = new MutationObserver(batch => records.push(...batch))

  observer.observe(document.documentElement, { attributes: true, attributeOldValue: true })
  const root = hydrateRoot(container, app)

  try {
    await act(async () => {})
    records.push(...observer.takeRecords())

    const classes = [
      ...records.flatMap(record => (record.attributeName === 'class' ? [record.oldValue] : [])),
      document.documentElement.className,
    ]

    expect(classes.filter(value => value?.includes('light'))).toEqual([])
    expect(document.documentElement.dataset.theme).toBe('system')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  } finally {
    observer.disconnect()
    matchMedia.mockRestore()
    await act(async () => root.unmount())
  }
})
