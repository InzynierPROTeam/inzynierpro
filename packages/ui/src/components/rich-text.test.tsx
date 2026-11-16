import {
  fixtureAssetId,
  richContentNodeFixtures,
  unsupportedNodeFixture,
} from '@inzpro/rich-content/fixtures'
import type { AnyRichContent } from '@inzpro/rich-content/rich-content'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'

import { RichText } from './rich-text.js'

const render = (
  content: AnyRichContent,
  assets: ReadonlyArray<{ readonly id: string; readonly url: string | null }> = [],
) => {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(
    <RichText
      content={content}
      assets={assets}
    />,
  )

  return container
}

describe('every version 1 node renders', () => {
  test('a paragraph with bold and italic text', () => {
    const view = render(richContentNodeFixtures.paragraph)

    expect(view.querySelector('p')?.textContent).toBe('Zwykły, pogrubiony i pochylony')
    expect(view.querySelector('p strong')?.textContent).toBe('pogrubiony')
    expect(view.querySelector('p em')?.textContent).toBe('pochylony')
  })

  test('a heading at its level', () => {
    expect(render(richContentNodeFixtures.heading).querySelector('h3')?.textContent).toBe('Zakres')
  })

  test('a bullet list', () => {
    const items = render(richContentNodeFixtures.bulletList).querySelectorAll('ul > li')

    expect([...items].map(item => item.textContent)).toEqual(['Inwestor', 'Projektant'])
  })

  test('an ordered list from its start number', () => {
    const list = render(richContentNodeFixtures.orderedList).querySelector('ol')

    expect(list?.getAttribute('start')).toBe('3')
    expect([...(list?.querySelectorAll('li') ?? [])].map(item => item.textContent)).toEqual([
      'Wniosek',
      'Decyzja',
    ])
  })

  test('a quote', () => {
    expect(
      render(richContentNodeFixtures.blockquote).querySelector('blockquote')?.textContent,
    ).toBe('Art. 17 Prawa budowlanego')
  })

  test('a table with its header row', () => {
    const table = render(richContentNodeFixtures.table).querySelector('table')

    expect([...(table?.querySelectorAll('thead th') ?? [])].map(cell => cell.textContent)).toEqual([
      'Budynek',
      'Wysokość',
    ])
    expect([...(table?.querySelectorAll('tbody td') ?? [])].map(cell => cell.textContent)).toEqual([
      'Jednorodzinny',
      '0,9 m',
    ])
  })

  test('an image with an address, its alternative text and caption', () => {
    const view = render(richContentNodeFixtures.image, [
      { id: fixtureAssetId, url: 'https://assets.example.test/schody.png' },
    ])

    const image = view.querySelector('figure img')

    expect(image?.getAttribute('src')).toBe('https://assets.example.test/schody.png')
    expect(image?.getAttribute('alt')).toBe('Przekrój schodów')
    expect(view.querySelector('figcaption')?.textContent).toBe('Rys. 1. Bieg schodów')
  })
})

test('an image without an address shows a placeholder with its alternative text', () => {
  const view = render(richContentNodeFixtures.image, [{ id: fixtureAssetId, url: null }])

  expect(view.querySelector('img')).toBeNull()
  expect(view.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Przekrój schodów')
  expect(view.textContent).toContain('Obraz niedostępny: Przekrój schodów')
  expect(view.querySelector('figcaption')?.textContent).toBe('Rys. 1. Bieg schodów')
})

test('content renders inside the shared typeset styles', () => {
  expect(render(richContentNodeFixtures.paragraph).firstElementChild?.className).toBe(
    'typeset typeset-docs',
  )
})

test('an unsupported node shows a message and keeps the content around it', () => {
  const view = render(unsupportedNodeFixture)

  expect([...view.querySelectorAll('p')].map(paragraph => paragraph.textContent)).toEqual([
    'Przed wzorem',
    'Ten fragment nie może zostać wyświetlony w tej wersji aplikacji.',
    'Po wzorze',
  ])
})

test('an unsupported inline node shows a message inside its paragraph', () => {
  const view = render({
    version: 1,
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Patrz ' },
            { type: 'mention', attrs: { id: 'art-17' } },
          ],
        },
      ],
    },
  })

  expect(view.querySelectorAll('p')).toHaveLength(1)
  expect(view.querySelector('p')?.textContent).toBe(
    'Patrz Ten fragment nie może zostać wyświetlony w tej wersji aplikacji.',
  )
})
