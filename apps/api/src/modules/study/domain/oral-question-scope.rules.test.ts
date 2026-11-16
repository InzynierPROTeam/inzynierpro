import { DistrictChamberId } from '@inzpro/domain/modules/exam-calendar/district-chamber'
import { Effect, Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { DistrictChamberNotChosen } from './errors.js'
import { oralQuestionFilter } from './oral-question-scope.rules.js'

const mazowiecka = Schema.decodeSync(DistrictChamberId)('51000000-0000-4000-8000-000000000007')

describe('oral question filter', () => {
  it.each([Option.none(), Option.some({ id: mazowiecka })])(
    'the whole path scope selects every question regardless of the chosen chamber',
    districtChamber =>
      expect(Effect.runSync(oralQuestionFilter('path', districtChamber))).toEqual({
        questionScope: 'path',
        reportedIn: Option.none(),
      }),
  )

  it('reported in my chamber narrows to the chamber chosen on the path assignment', () =>
    expect(
      Effect.runSync(oralQuestionFilter('reported_in_my_chamber', Option.some({ id: mazowiecka }))),
    ).toEqual({ questionScope: 'reported_in_my_chamber', reportedIn: Option.some(mazowiecka) }))

  it('reported in my chamber without a chosen chamber fails', () =>
    expect(
      Effect.runSync(Effect.flip(oralQuestionFilter('reported_in_my_chamber', Option.none()))),
    ).toEqual(new DistrictChamberNotChosen()))
})
