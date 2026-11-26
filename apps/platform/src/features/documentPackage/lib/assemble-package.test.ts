import { Effect } from 'effect'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { countPackagePages } from './assemble-package'

class TestWorker extends EventTarget {
  terminationCount = 0

  constructor() {
    super()
    workers.push(this)
  }

  postMessage = vi.fn()

  terminate() {
    this.terminationCount++
  }
}

const workers: Array<TestWorker> = []

beforeEach(() => {
  workers.length = 0
  vi.stubGlobal('Worker', TestWorker)
})

afterEach(() => vi.unstubAllGlobals())

const request = {
  type: 'count' as const,
  documents: [],
  pathName: 'Konstrukcyjno-budowlana',
  generationDate: '25 listopada 2026',
}

test('abandoning a count terminates its worker and rejects the result', async () => {
  const controller = new AbortController()
  const reason = new Error('Selection changed')
  const result = Effect.runPromise(countPackagePages(request), { signal: controller.signal })
  controller.abort(reason)
  workers[0]!.dispatchEvent(
    new MessageEvent('message', { data: { type: 'counted', pageCount: 18 } }),
  )

  await expect(result).rejects.toThrow()
  expect(workers[0]!.terminationCount).toBe(1)
})

test('an already abandoned count releases any acquired worker', async () => {
  const controller = new AbortController()
  const reason = new Error('Page left')
  controller.abort(reason)
  const result = Effect.runPromise(countPackagePages(request), { signal: controller.signal })
  workers[0]?.dispatchEvent(
    new MessageEvent('message', { data: { type: 'counted', pageCount: 18 } }),
  )

  await expect(result).rejects.toThrow()
  expect(workers.every(worker => worker.terminationCount === 1)).toBe(true)
})

test('a completed count releases its worker and abort listener', async () => {
  const controller = new AbortController()
  const result = Effect.runPromise(countPackagePages(request), { signal: controller.signal })
  workers[0]!.dispatchEvent(
    new MessageEvent('message', { data: { type: 'counted', pageCount: 18 } }),
  )

  await expect(result).resolves.toBe(18)
  controller.abort()
  expect(workers[0]!.terminationCount).toBe(1)
})
