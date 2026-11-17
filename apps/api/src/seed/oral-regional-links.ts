import {
  iarpMazowieckaDistrictChamberCode,
  iarpSlaskaDistrictChamberCode,
  type DistrictChamberCode,
  piibMalopolskaDistrictChamberCode,
  piibMazowieckaDistrictChamberCode,
} from '@inzpro/domain/modules/exam-calendar/district-chamber'
import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'
import {
  officialRegionalSource,
  recollectionRegionalSource,
  type RegionalSourceKind,
} from '~api/modules/learning-content/domain/learning-content.model.js'

import { catalogueId } from './catalogue-id.js'
import { catalogueDistrictChambers } from './chamber-catalogue.js'

const regionalLinks: ReadonlyArray<{
  readonly chamber: DistrictChamberCode
  readonly questionNumber: number
  readonly sourceKind: RegionalSourceKind
  readonly recordedAt: string
}> = [
  {
    chamber: piibMazowieckaDistrictChamberCode,
    questionNumber: 1,
    sourceKind: recollectionRegionalSource,
    recordedAt: '2026-06-12T10:00:00.000Z',
  },
  {
    chamber: piibMazowieckaDistrictChamberCode,
    questionNumber: 2,
    sourceKind: officialRegionalSource,
    recordedAt: '2026-03-02T09:00:00.000Z',
  },
  {
    chamber: piibMazowieckaDistrictChamberCode,
    questionNumber: 5,
    sourceKind: recollectionRegionalSource,
    recordedAt: '2026-06-12T10:00:00.000Z',
  },
  {
    chamber: piibMazowieckaDistrictChamberCode,
    questionNumber: 9,
    sourceKind: recollectionRegionalSource,
    recordedAt: '2025-12-04T11:00:00.000Z',
  },
  {
    chamber: piibMalopolskaDistrictChamberCode,
    questionNumber: 3,
    sourceKind: officialRegionalSource,
    recordedAt: '2026-03-02T09:00:00.000Z',
  },
  {
    chamber: piibMalopolskaDistrictChamberCode,
    questionNumber: 7,
    sourceKind: recollectionRegionalSource,
    recordedAt: '2026-06-15T12:00:00.000Z',
  },
  {
    chamber: iarpMazowieckaDistrictChamberCode,
    questionNumber: 1,
    sourceKind: officialRegionalSource,
    recordedAt: '2026-04-20T08:00:00.000Z',
  },
  {
    chamber: iarpMazowieckaDistrictChamberCode,
    questionNumber: 4,
    sourceKind: recollectionRegionalSource,
    recordedAt: '2026-06-18T13:00:00.000Z',
  },
  {
    chamber: iarpMazowieckaDistrictChamberCode,
    questionNumber: 10,
    sourceKind: recollectionRegionalSource,
    recordedAt: '2026-06-18T13:00:00.000Z',
  },
  {
    chamber: iarpSlaskaDistrictChamberCode,
    questionNumber: 6,
    sourceKind: officialRegionalSource,
    recordedAt: '2026-04-20T08:00:00.000Z',
  },
  {
    chamber: iarpSlaskaDistrictChamberCode,
    questionNumber: 11,
    sourceKind: recollectionRegionalSource,
    recordedAt: '2025-12-09T10:00:00.000Z',
  },
]

export const seedOralRegionalLinks = Effect.fn('seedOralRegionalLinks')(function* () {
  const sql = yield* SqlClient.SqlClient

  for (const link of regionalLinks) {
    const chamber = catalogueDistrictChambers.find(entry => entry.code === link.chamber)

    if (chamber === undefined) {
      return yield* Effect.die(new Error(`Missing seeded district chamber ${link.chamber}`))
    }

    yield* sql`INSERT INTO oral_question_regional_links (question_id,district_chamber_id,source_kind,recorded_at)
    VALUES (${catalogueId('33', link.questionNumber)},${chamber.id},${link.sourceKind},${link.recordedAt}) ON CONFLICT DO NOTHING`
  }
})
