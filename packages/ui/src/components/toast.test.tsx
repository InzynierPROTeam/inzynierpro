import { act } from 'react'
import { expect, test } from 'vitest'
import { render } from '~ui/test/render.js'

import { createToastManager, Toaster } from './toast.js'

const toastIn = (title: string) =>
  [...document.querySelectorAll('[data-slot="toast"]')].find(toast =>
    toast.textContent?.includes(title),
  )

const iconOf = (title: string) => toastIn(title)?.querySelector('[data-slot="toast-icon"] svg')

const showPromise = async (outcome: Promise<string>) => {
  const manager = createToastManager()

  await render(<Toaster toastManager={manager} />)
  await act(async () => {
    void manager
      .promise(outcome, {
        loading: { title: 'Zapisywanie…' },
        success: { title: 'Zapisano.' },
        error: { title: 'Nie udało się zapisać.' },
      })
      .catch(() => {})
  })
}

test('a pending action shows a loading toast that becomes a success toast', async () => {
  const { promise, resolve } = Promise.withResolvers<string>()

  await showPromise(promise)
  expect(toastIn('Zapisywanie…')).toBeDefined()
  expect(iconOf('Zapisywanie…')?.classList.contains('animate-spin')).toBe(true)

  await act(async () => resolve('ok'))
  expect(toastIn('Zapisywanie…')).toBeUndefined()
  expect(iconOf('Zapisano.')).toBeInstanceOf(SVGElement)
})

test('a failed action ends in an error toast with its own icon', async () => {
  const { promise, reject } = Promise.withResolvers<string>()

  await showPromise(promise)
  await act(async () => reject(new Error('network')))

  expect(iconOf('Nie udało się zapisać.')).toBeInstanceOf(SVGElement)
  expect(iconOf('Nie udało się zapisać.')?.classList.contains('animate-spin')).toBe(false)
})

test('a plain message without a type shows no icon', async () => {
  const manager = createToastManager()

  await render(<Toaster toastManager={manager} />)
  await act(async () => {
    manager.add({ title: 'Informacja bez typu' })
  })

  expect(toastIn('Informacja bez typu')).toBeDefined()
  expect(iconOf('Informacja bez typu')).toBeNull()
})
