// @vitest-environment jsdom
import { Duration } from 'effect'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { Countdown } from './Countdown'

let root: Root
let container: HTMLDivElement

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

test('counts down from the remaining time and reports the end once', async () => {
  const onFinish = vi.fn()

  await act(async () =>
    root.render(
      <Countdown
        remaining={Duration.seconds(3)}
        onFinish={onFinish}
      />,
    ),
  )
  expect(container.textContent).toBe('00:00:03')

  await act(async () => vi.advanceTimersByTime(1000))
  expect(container.textContent).toBe('00:00:02')

  await act(async () => vi.advanceTimersByTime(5000))
  expect(container.textContent).toBe('00:00:00')
  expect(onFinish).toHaveBeenCalledOnce()
})

test('keeps counting by elapsed time when ticks are delayed', async () => {
  vi.setSystemTime('2026-11-13T12:00:00.000Z')

  await act(async () =>
    root.render(
      <Countdown
        remaining={Duration.minutes(10)}
        onFinish={() => undefined}
      />,
    ),
  )

  await act(async () => {
    vi.setSystemTime('2026-11-13T12:02:00.000Z')
    vi.advanceTimersToNextTimer()
  })

  expect(container.textContent).toBe('00:07:59')
})

test('reports the end at once when no time remains', async () => {
  const onFinish = vi.fn()

  await act(async () =>
    root.render(
      <Countdown
        remaining={Duration.zero}
        onFinish={onFinish}
      />,
    ),
  )

  expect(container.textContent).toBe('00:00:00')
  expect(onFinish).toHaveBeenCalledOnce()
})
