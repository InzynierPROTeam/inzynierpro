import { Schema } from 'effect'
import { expect, test } from 'vitest'

import { ContentAsset } from './learning-content.model.js'

const storedFile = { id: '28000000-0000-4000-8000-000000000099', size: 2048 }

test('an image asset needs its dimensions', () => {
  expect(() =>
    Schema.decodeUnknownSync(ContentAsset)({
      ...storedFile,
      storageKey: 'test/figure.png',
      mediaType: 'image/png',
    }),
  ).toThrow()
})

test('a PDF asset is valid without dimensions but needs its page count', () => {
  expect(
    Schema.decodeSync(ContentAsset)({
      ...storedFile,
      storageKey: 'test/statute.pdf',
      mediaType: 'application/pdf',
      pageCount: 3,
    }),
  ).toMatchObject({ mediaType: 'application/pdf', pageCount: 3 })
  expect(() =>
    Schema.decodeUnknownSync(ContentAsset)({
      ...storedFile,
      storageKey: 'test/statute.pdf',
      mediaType: 'application/pdf',
    }),
  ).toThrow()
})

test('an image asset carries no page count', () => {
  expect(
    Schema.decodeSync(ContentAsset)({
      ...storedFile,
      storageKey: 'test/figure.png',
      mediaType: 'image/png',
      width: 640,
      height: 480,
    }),
  ).not.toHaveProperty('pageCount')
})
