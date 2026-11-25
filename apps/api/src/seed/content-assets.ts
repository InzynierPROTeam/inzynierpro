import { readFile } from 'node:fs/promises'

import {
  ContentAssetId,
  pdfMediaType,
  pngMediaType,
} from '@inzpro/domain/modules/learning-content/content-asset'
import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'
import { PDFDocument } from 'pdf-lib'
import { FileStorage } from '~api/modules/learning-content/application/file-storage.service.js'

import { catalogueId } from './catalogue-id.js'

export const stairRiserHeightAssetId = ContentAssetId.make(catalogueId('28', 1))

export const professionalSelfGovernmentPdfAssetId = ContentAssetId.make(catalogueId('28', 2))

export const buildingLawPdfAssetId = ContentAssetId.make(catalogueId('28', 3))

export const technicalConditionsPdfAssetId = ContentAssetId.make(catalogueId('28', 4))

const assets = [
  {
    id: stairRiserHeightAssetId,
    storageKey: `content-assets/${stairRiserHeightAssetId}.png`,
    mediaType: pngMediaType,
    width: 640,
    height: 360,
    file: new URL('./assets/stair-riser-height.png', import.meta.url),
  },
  // EXTERNAL: Generated from chapter 1 of the consolidated text Dz.U. 2025 poz. 1783, https://eli.gov.pl/api/acts/DU/2025/1783/text.pdf.
  {
    id: professionalSelfGovernmentPdfAssetId,
    storageKey: `content-assets/${professionalSelfGovernmentPdfAssetId}.pdf`,
    mediaType: pdfMediaType,
    width: null,
    height: null,
    file: new URL('./assets/professional-self-government-chapter-1.pdf', import.meta.url),
  },
  // EXTERNAL: Generated from the seeded units of Prawo budowlane, Dz.U. 2024 poz. 725 (t.j.), https://eli.gov.pl/api/acts/DU/2024/725/text.html.
  {
    id: buildingLawPdfAssetId,
    storageKey: `content-assets/${buildingLawPdfAssetId}.pdf`,
    mediaType: pdfMediaType,
    width: null,
    height: null,
    file: new URL('./assets/building-law-excerpt.pdf', import.meta.url),
  },
  // EXTERNAL: Generated from the seeded units of the technical conditions regulation, Dz.U. 2022 poz. 1225 (t.j.), https://eli.gov.pl/api/acts/DU/2022/1225/text.pdf.
  {
    id: technicalConditionsPdfAssetId,
    storageKey: `content-assets/${technicalConditionsPdfAssetId}.pdf`,
    mediaType: pdfMediaType,
    width: null,
    height: null,
    file: new URL('./assets/technical-conditions-excerpt.pdf', import.meta.url),
  },
] as const

const pageCountOf = (asset: (typeof assets)[number], body: Uint8Array) =>
  asset.mediaType === pdfMediaType
    ? Effect.tryPromise(() => PDFDocument.load(body)).pipe(
        Effect.map(document => document.getPageCount()),
      )
    : Effect.succeed(null)

export const seedContentAssets = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const fileStorage = yield* FileStorage

  for (const asset of assets) {
    const body = new Uint8Array(yield* Effect.tryPromise(() => readFile(asset.file)))

    const pageCount = yield* pageCountOf(asset, body)

    yield* fileStorage.put({ key: asset.storageKey, mediaType: asset.mediaType, body })
    yield* sql`INSERT INTO content_assets (id,storage_key,media_type,width,height,size_bytes,page_count)
      VALUES (${asset.id},${asset.storageKey},${asset.mediaType},${asset.width},${asset.height},${body.byteLength},${pageCount})
      ON CONFLICT (id) DO UPDATE SET storage_key=EXCLUDED.storage_key,media_type=EXCLUDED.media_type,width=EXCLUDED.width,height=EXCLUDED.height,size_bytes=EXCLUDED.size_bytes,page_count=EXCLUDED.page_count`
  }
})
