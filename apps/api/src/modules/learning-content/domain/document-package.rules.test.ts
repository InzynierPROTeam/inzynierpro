import { ByteSize } from '@inzpro/domain/modules/learning-content/content-asset'
import {
  type ContentAvailability,
  DocumentPageCount,
} from '@inzpro/domain/modules/learning-content/document-edition'
import { Option } from 'effect'
import { expect, test } from 'vitest'

import { packageAvailability } from './document-package.rules.js'

const pdf = Option.some({ pageCount: DocumentPageCount.make(12), size: ByteSize.make(4096) })

const edition = (
  contentAvailability: ContentAvailability,
  downloadable: boolean,
  file: typeof pdf | Option.Option<never> = pdf,
) => ({ contentAvailability, downloadable, pdf: file })

test('a downloadable edition with a PDF is included in the package', () => {
  expect(packageAvailability(edition('full_content', true))).toBe('included')
  expect(packageAvailability(edition('pdf_only', true))).toBe('included')
})

test('a metadata-only edition is unavailable as metadata only, whatever its flags', () => {
  expect(packageAvailability(edition('metadata_only', true))).toBe('metadata_only')
  expect(packageAvailability(edition('metadata_only', false, Option.none()))).toBe('metadata_only')
})

test('an edition without a PDF is unavailable for lack of a PDF', () => {
  expect(packageAvailability(edition('full_content', true, Option.none()))).toBe('no_pdf')
  expect(packageAvailability(edition('full_content', false, Option.none()))).toBe('no_pdf')
})

test('an edition whose PDF may not be downloaded is unavailable for that reason', () => {
  expect(packageAvailability(edition('full_content', false))).toBe('download_not_allowed')
  expect(packageAvailability(edition('pdf_only', false))).toBe('download_not_allowed')
})
