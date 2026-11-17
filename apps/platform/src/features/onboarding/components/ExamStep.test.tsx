// @vitest-environment jsdom
import { oralExamAccess, writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { examSessionsQueryOptions } from '@inzpro/queries/modules/exam-calendar/queries'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { apiHttpClient } from '~platform/lib/api-client'

import { onboardingSessionsLimit } from '../config'
import { ExamStep } from './ExamStep'

const specializationId = SpecializationId.make('60000000-0000-4000-8000-000000000001')
let queryClient: QueryClient
let root: Root
let container: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(
    examSessionsQueryOptions(apiHttpClient, {
      query: { specializationId, limit: onboardingSessionsLimit },
    }).queryKey,
    { data: [], meta: { hasMore: false } },
  )
})

afterEach(async () => {
  await act(async () => root.unmount())
  queryClient.clear()
  container.remove()
  vi.unstubAllGlobals()
})

test('selection is local until the step is submitted and starts from the committed value', async () => {
  const onNext = vi.fn(async () => {})
  const onBack = vi.fn()
  await act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <ExamStep
          specializationId={specializationId}
          initialValue={writtenExamAccess}
          onNext={onNext}
          onBack={onBack}
        />
      </QueryClientProvider>,
    ),
  )
  expect(container.querySelector('[role="radio"][data-checked]')?.textContent).toContain('Pisemny')

  const oral = [...container.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find(
    node => node.textContent === 'Ustny',
  )

  expect(oral).toBeDefined()
  await act(async () => oral?.click())
  expect(onNext).not.toHaveBeenCalled()
  expect(container.querySelector('[role="radio"][data-checked]')?.textContent).toBe('Ustny')
  await act(async () =>
    container
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
  expect(onNext).toHaveBeenCalledExactlyOnceWith(oralExamAccess)
})

test('an empty step cannot continue and going back discards the local choice', async () => {
  const onNext = vi.fn(async () => {})
  const onBack = vi.fn()
  await act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <ExamStep
          specializationId={specializationId}
          initialValue={undefined}
          onNext={onNext}
          onBack={onBack}
        />
      </QueryClientProvider>,
    ),
  )
  await act(async () =>
    container
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
  expect(onNext).not.toHaveBeenCalled()
  expect(container.textContent).toContain('Wybierz egzamin, do którego chcesz się przygotować.')
  expect(container.querySelector('[role="radiogroup"]')?.getAttribute('aria-invalid')).toBe('true')

  const oral = [...container.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find(
    node => node.textContent === 'Ustny',
  )

  await act(async () => oral?.click())

  const back = [...container.querySelectorAll<HTMLButtonElement>('button')].find(
    node => node.getAttribute('aria-label') === 'Poprzedni krok',
  )

  await act(async () => back?.click())
  expect(onBack).toHaveBeenCalledOnce()
  expect(onNext).not.toHaveBeenCalled()
})
