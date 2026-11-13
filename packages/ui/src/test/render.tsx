import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach } from 'vitest'

let mounted: { readonly root: Root; readonly container: HTMLDivElement } | undefined

afterEach(async () => {
  if (mounted !== undefined) {
    const { root, container } = mounted

    await act(async () => root.unmount())
    container.remove()
    mounted = undefined
  }
})

// Renders into a container attached to the document and unmounted after the test. Rendering again
// in the same test updates the same root.
export const render = async (element: ReactNode) => {
  if (mounted === undefined) {
    const container = document.createElement('div')

    document.body.append(container)
    mounted = { root: createRoot(container), container }
  }

  const { root, container } = mounted

  await act(async () => root.render(element))

  return container
}
