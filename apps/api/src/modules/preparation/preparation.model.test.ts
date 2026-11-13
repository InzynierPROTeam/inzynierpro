import { bothExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { UserExamGoal as GoalDto } from '@inzpro/domain/modules/preparation/user-exam-goal'
import { DateTime, Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { UserExamGoal } from './preparation.model.js'
import { toUserExamGoalDto } from './preparation.presentation.js'

const input = {
  version: 1,
  examSessionId: '01997d80-0000-7000-8000-000000000001',
  sessionName: 'Wiosna 2026',
  sessionIsConfirmed: true,
  writtenAt: '2026-05-15T08:00:00.000Z',
  oralPlanningAt: '2026-05-18T08:00:00.000Z',
  oralExamDate: null,
  accessScope: bothExamAccess,
} satisfies typeof UserExamGoal.Encoded

describe('preparation model and HTTP presentation', () => {
  it.each([null, '2026-05-19T09:30:00.000Z'])(
    'maps rich dates and Option to JSON for oral date %s',
    oralExamDate => {
      const model = Schema.decodeSync(UserExamGoal)({ ...input, oralExamDate })
      expect(DateTime.isDateTime(model.writtenAt)).toBe(true)
      expect(Option.isSome(model.oralExamDate)).toBe(oralExamDate !== null)
      const dto = toUserExamGoalDto(model)
      expect(dto).toEqual({ ...input, oralExamDate })
      expect(Schema.decodeSync(GoalDto)(dto)).toEqual(dto)
      expect(JSON.parse(JSON.stringify(dto))).toEqual(dto)
    },
  )

  it('accepts native dates only at the SQL model decoding boundary', () => {
    const model = Schema.decodeSync(UserExamGoal)({
      ...input,
      writtenAt: DateTime.toDateUtc(DateTime.makeUnsafe(input.writtenAt)),
    })

    expect(toUserExamGoalDto(model).writtenAt).toBe(input.writtenAt)
  })
})
