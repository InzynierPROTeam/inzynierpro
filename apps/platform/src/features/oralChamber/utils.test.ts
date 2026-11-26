import { DistrictChamber } from '@inzpro/api-contracts/modules/exam-calendar/responses'
import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { getOralQuestionScope } from '~platform/features/oralChamber/utils'

const opolska = Schema.decodeSync(DistrictChamber)({
  id: '51000000-0000-4000-8000-000000000008',
  code: 'piib-opolska',
  name: 'Opolska Okręgowa Izba Inżynierów Budownictwa',
  shortName: 'Opolska OIIB',
})

describe('oral question scope', () => {
  it('narrows to the chamber only when the filter is on and a chamber is chosen', () => {
    expect(getOralQuestionScope({ districtChamber: opolska }, true)).toBe('reported_in_my_chamber')
    expect(getOralQuestionScope({ districtChamber: opolska }, false)).toBe('path')
    expect(getOralQuestionScope({ districtChamber: null }, true)).toBe('path')
  })
})
