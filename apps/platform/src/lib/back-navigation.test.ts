import { createMemoryHistory } from '@tanstack/react-router'
import { beforeEach, expect, it, vi } from 'vitest'

const storage = new Map<string, string>()

beforeEach(() => {
  storage.clear()
  vi.resetModules()
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  })
})

const startTracking = async (initialEntries = ['/nauka']) => {
  const navigation = await import('./back-navigation')
  const history = createMemoryHistory({ initialEntries })
  navigation.trackBackNavigation(history)

  return {
    history,
    origin: () => navigation.getBackOrigin(history.location)?.href,
    steps: () => {
      const origin = navigation.getBackOrigin(history.location)

      return origin === undefined ? undefined : origin.index - history.location.state.__TSR_index
    },
  }
}

it('has no origin on the entry page, so the fallback applies', async () => {
  const { origin } = await startTracking()

  expect(origin()).toBeUndefined()
})

it('returns to the page the user came from, one step back', async () => {
  const { history, origin, steps } = await startTracking()
  history.push('/nauka/kategoria/a')

  expect(origin()).toBe('/nauka')
  expect(steps()).toBe(-1)

  history.push('/nauka/start?akt-prawny=a')

  expect(origin()).toBe('/nauka/kategoria/a')
})

it('follows the actual path, not the page hierarchy', async () => {
  const { history, origin } = await startTracking(['/start'])
  history.push('/nauka/start')

  expect(origin()).toBe('/start')
})

it('keeps the origin when only the search of the same page changes', async () => {
  const { history, origin, steps } = await startTracking()
  history.push('/nauka/start?akt-prawny=a')
  history.push('/nauka/start?akt-prawny=a&liczba-pytan=10')

  expect(origin()).toBe('/nauka')
  expect(steps()).toBe(-2)
})

it('keeps the origin through a redirect that replaces the entry', async () => {
  const { history, origin } = await startTracking()
  history.push('/ustny')
  history.replace('/rozszerz-dostep')

  expect(origin()).toBe('/nauka')
})

it('restores each entry origin on back and forward', async () => {
  const { history, origin } = await startTracking()
  history.push('/nauka/kategoria/a')
  history.push('/nauka/start')
  history.back()

  expect(origin()).toBe('/nauka')

  history.forward()

  expect(origin()).toBe('/nauka/kategoria/a')
})

it('survives a reload of the tab', async () => {
  const first = await startTracking()
  first.history.push('/nauka/kategoria/a')
  const entry = first.history.location

  vi.resetModules()
  const navigation = await import('./back-navigation')
  navigation.trackBackNavigation(createMemoryHistory())

  expect(navigation.getBackOrigin(entry)?.href).toBe('/nauka')
})
