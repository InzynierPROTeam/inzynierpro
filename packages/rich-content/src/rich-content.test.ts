import { Schema } from 'effect'
import { describe, expect, test } from 'vitest'

import { fixtureAssetId, richContentNodeFixtures, unsupportedNodeFixture } from './fixtures.js'
import { type AnyRichContentNode, imageAssetIds, paragraphs, RichContent } from './rich-content.js'

const isValid = Schema.is(RichContent)

const withBlock = (block: AnyRichContentNode) =>
  ({ version: 1, doc: { type: 'doc', content: [block] } }) as const

describe('version 1 rich content', () => {
  test.each(Object.entries(richContentNodeFixtures))('accepts the %s node', (_, content) => {
    expect(isValid(content)).toBe(true)
  })

  test('rejects an unknown node', () => {
    expect(isValid(unsupportedNodeFixture)).toBe(false)
  })

  test('rejects an unknown mark', () => {
    expect(
      isValid(
        withBlock({
          type: 'paragraph',
          content: [{ type: 'text', text: 'Link', marks: [{ type: 'link' }] }],
        }),
      ),
    ).toBe(false)
  })

  test('rejects an image with an embedded source instead of an asset', () => {
    expect(
      isValid(
        withBlock({
          type: 'image',
          attrs: { src: 'data:image/png;base64,iVBORw0KGgo=', alt: 'Rysunek', caption: null },
        }),
      ),
    ).toBe(false)
  })

  test('keeps no embedded source beside an image asset', () => {
    const image = { assetId: fixtureAssetId, alt: 'Rysunek', caption: null }

    expect(
      Schema.decodeSync(RichContent)(
        withBlock({
          type: 'image',
          attrs: { ...image, src: 'data:image/png;base64,iVBORw0KGgo=' },
        }),
      ),
    ).toEqual(withBlock({ type: 'image', attrs: image }))
  })

  test('rejects an image without alternative text', () => {
    expect(
      isValid(
        withBlock({ type: 'image', attrs: { assetId: fixtureAssetId, alt: '', caption: null } }),
      ),
    ).toBe(false)
  })

  test('rejects an empty document, an empty text and another version', () => {
    expect(isValid({ version: 1, doc: { type: 'doc', content: [] } })).toBe(false)
    expect(isValid(withBlock({ type: 'paragraph', content: [{ type: 'text', text: '' }] }))).toBe(
      false,
    )
    expect(isValid({ ...richContentNodeFixtures.paragraph, version: 2 })).toBe(false)
  })

  test('rejects a heading level outside the schema', () => {
    expect(
      isValid(
        withBlock({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'A' }] }),
      ),
    ).toBe(false)
  })
})

test('paragraphs turns blank-line separated text into paragraphs', () => {
  expect(paragraphs('Pierwszy akapit.\n\nDrugi akapit.')).toEqual({
    version: 1,
    doc: {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Pierwszy akapit.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Drugi akapit.' }] },
      ],
    },
  })
})

test('imageAssetIds lists the assets of nested images once', () => {
  const nested = {
    version: 1,
    doc: {
      type: 'doc',
      content: [
        richContentNodeFixtures.image.doc.content[0],
        {
          type: 'blockquote',
          content: [richContentNodeFixtures.image.doc.content[0]],
        },
      ],
    },
  } as const

  expect(imageAssetIds(nested)).toEqual([fixtureAssetId])
})
