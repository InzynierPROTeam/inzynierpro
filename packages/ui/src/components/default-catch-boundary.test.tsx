import { expect, test, vi } from 'vitest'
import { render } from '~ui/test/render.js'

import { DefaultCatchBoundary } from './default-catch-boundary.js'

const renderBoundary = (reset: VoidFunction, media?: React.ReactNode) =>
  render(
    <DefaultCatchBoundary
      title="Ups! Coś poszło nie tak."
      description="Spróbuj ponownie za chwilę."
      goBackText="Wróć"
      tryAgainText="Spróbuj ponownie"
      reset={reset}
      media={media}
    />,
  )

const button = (container: HTMLElement, name: string) =>
  [...container.querySelectorAll('button')].find(item => item.textContent === name)

test('trying again resets the failed boundary and going back leaves the page', async () => {
  const reset = vi.fn()
  const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
  const container = await renderBoundary(reset)

  expect(container.textContent).toContain('Ups! Coś poszło nie tak.')

  button(container, 'Spróbuj ponownie')?.click()
  expect(reset).toHaveBeenCalledOnce()
  expect(back).not.toHaveBeenCalled()

  button(container, 'Wróć')?.click()
  expect(back).toHaveBeenCalledOnce()
  back.mockRestore()
})

test('shows the alert icon by default, custom media instead, and nothing for null', async () => {
  const container = await renderBoundary(() => {})

  expect(container.querySelector('svg')).not.toBeNull()

  await renderBoundary(() => {}, <img alt="Zepsuty most" />)
  expect(container.querySelector('svg')).toBeNull()
  expect(container.querySelector('img')?.alt).toBe('Zepsuty most')

  await renderBoundary(() => {}, null)
  expect(container.querySelector('svg, img')).toBeNull()
})
