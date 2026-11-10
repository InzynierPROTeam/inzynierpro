import { ChangeGoalPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { Schema } from 'effect'
import { isDateTimeInput } from '~platform/utils/date-time-input'

export const GoalFormValues = Schema.Struct({
  examSessionId: ChangeGoalPayload.fields.examSessionId,
  oralExamDate: Schema.String.check(
    Schema.makeFilter<string>(value => isDateTimeInput(value), {
      message: 'Podaj poprawny termin egzaminu ustnego.',
    }),
  ),
})
