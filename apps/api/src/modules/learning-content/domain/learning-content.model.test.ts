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

test('a PDF asset is valid without dimensions', () => {
  expect(
    Schema.decodeSync(ContentAsset)({
      ...storedFile,
      storageKey: 'test/statute.pdf',
      mediaType: 'application/pdf',
    }),
  ).toMatchObject({ mediaType: 'application/pdf' })
})
