// @vitest-environment jsdom
import type { Ranking, RankingEntry } from '@inzpro/api-contracts/modules/rankings/responses'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { RankingPosition } from '@inzpro/domain/modules/rankings/ranking'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { RankingList } from './RankingList'

let root: Root
let container: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('scrollTo', () => undefined)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

const entry = (
  position: number,
  name: string,
  xp: number,
  profileVisible = true,
): RankingEntry => ({
  position: RankingPosition.make(position),
  userId: UserId.make(`10000000-0000-4000-8000-${String(position).padStart(12, '0')}`),
  name,
  image: null,
  xp: LearningXp.make(xp),
  profileVisible,
})

const renderRanking = async (ranking: Ranking) => {
  const rootRoute = createRootRoute({ component: () => <RankingList ranking={ranking} /> })
  const profile = createRoute({ getParentRoute: () => rootRoute, path: 'uzytkownik/$userId' })

  const router = createRouter({
    routeTree: rootRoute.addChildren([profile]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  await router.load()
  await act(async () => root.render(<RouterProvider router={router} />))
}

const summary = () => container.querySelector('section[aria-label="Twój wynik"]')?.textContent

const rowsOf = (label: string) =>
  [...container.querySelectorAll(`ol[aria-label="${label}"] > li`)].map(row => ({
    text: row.textContent,
    link: row.querySelector('a')?.getAttribute('href') ?? null,
    own: row.getAttribute('aria-current') === 'true',
  }))

test('rows link to visible profiles only and mark the viewer inside the top', async () => {
  const visible = entry(1, 'Anna Nowak', 640)
  const hidden = entry(2, 'Piotr Wiśniewski', 410, false)
  const own = entry(3, 'Jan Kowalski', 120)

  await renderRanking({ entries: [visible, hidden, own], viewer: own })

  expect(rowsOf('Ranking')).toEqual([
    { text: '1.Anna Nowak640 XP', link: `/uzytkownik/${visible.userId}`, own: false },
    { text: '2.Piotr Wiśniewski410 XP', link: null, own: false },
    { text: '3.Jan Kowalski (Ty)120 XP', link: `/uzytkownik/${own.userId}`, own: true },
  ])
  expect(rowsOf('Twoje miejsce')).toEqual([])
  expect(summary()).toBe('Twoje miejsce: 3.120 XP')
})

test('the viewer outside the top gets their position above the list and a row after it', async () => {
  const own = entry(101, 'Jan Kowalski', 3)

  await renderRanking({ entries: [entry(1, 'Anna Nowak', 640)], viewer: own })

  expect(rowsOf('Twoje miejsce')).toEqual([
    { text: '101.Jan Kowalski (Ty)3 XP', link: `/uzytkownik/${own.userId}`, own: true },
  ])
  expect(summary()).toBe('Twoje miejsce: 101.3 XP')
})

test('a viewer without XP is invited to earn points', async () => {
  await renderRanking({ entries: [entry(1, 'Anna Nowak', 640)], viewer: null })

  expect(summary()).toContain('Nie masz jeszcze punktów w tym okresie')
  expect(rowsOf('Twoje miejsce')).toEqual([])
})
