// @vitest-environment jsdom
import { DailyPlan } from '@inzpro/api-contracts/modules/daily-plan/responses'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { Schema } from 'effect'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { DailyPlanSummary } from './DailyPlanSummary'

let root: Root
let container: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

const scheduled = {
  examDate: '2026-11-19T23:00:00.000Z',
  targetDate: '2026-11-18T23:00:00.000Z',
  daysUntilExam: 7,
  targetQuestionCount: 4,
  completedQuestionCount: 1,
  questionsBehindPace: 0,
}

const renderPlan = async (plan: typeof DailyPlan.Encoded) => {
  const decoded = Schema.decodeSync(DailyPlan)(plan)

  const router = createRouter({
    routeTree: createRootRoute({ component: () => <DailyPlanSummary plan={decoded} /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })

  await router.load()
  await act(async () => root.render(<RouterProvider router={router} />))

  return container.textContent ?? ''
}

test("shows today's progress, the days until the exam and that the learner is on pace", async () => {
  const text = await renderPlan({ status: 'planned', ...scheduled })

  expect(text).toContain('Pytania na dziś: 1 / 4')
  expect(text).toContain('25%')
  expect(text).toContain('Dni do egzaminu: 7')
  expect(text).toContain('Jesteś na bieżąco z planem.')
  expect(text).not.toContain('Ponad plan')
})

test('shows surplus above the target and the questions behind a linear pace', async () => {
  const text = await renderPlan({
    status: 'planned',
    ...scheduled,
    completedQuestionCount: 6,
    questionsBehindPace: 3,
  })

  expect(text).toContain('Pytania na dziś: 6 / 4')
  expect(text).toContain('Ponad plan: +2')
  expect(text).toContain('Pytania do nadrobienia: 3')
})

test('explains the final days before the exam', async () =>
  expect(await renderPlan({ status: 'final_days', ...scheduled })).toContain(
    'Ostatni tydzień przed egzaminem',
  ))

test('wishes luck instead of a target on the exam day', async () => {
  const text = await renderPlan({
    status: 'final_days',
    ...scheduled,
    daysUntilExam: 0,
    targetQuestionCount: 0,
  })

  expect(text).toContain('Dziś egzamin')
  expect(text).not.toContain('Pytania na dziś')
})

test('marks the day done once the round closes', async () => {
  const text = await renderPlan({ status: 'round_completed', ...scheduled, targetQuestionCount: 0 })

  expect(text).toContain('Runda nauki ukończona')
  expect(text).toContain('Odpowiedzi dziś: 1')
  expect(text).not.toContain('Pytania na dziś')
})

test('asks to update the goal once the exam date has passed', async () => {
  await renderPlan({ status: 'exam_passed', examDate: '2026-11-19T23:00:00.000Z' })

  expect(container.textContent).toContain('Termin egzaminu (20 listopada 2026) minął')
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/profil')
})

test('has a distinct message for a path without material', async () =>
  expect(await renderPlan({ status: 'no_material' })).toContain(
    'Na tej ścieżce nie ma jeszcze materiału',
  ))
