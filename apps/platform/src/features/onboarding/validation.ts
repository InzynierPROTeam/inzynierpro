import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { ExamAccessScope } from '@inzpro/domain/modules/preparation/exam-access'
import { QualificationKindId } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import { QualificationScopeId } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Schema } from 'effect'
import { isDateTimeInput } from '~platform/utils/date-time-input'

export const OnboardingSearch = Schema.Struct({
  specjalnosc: Schema.optional(SpecializationId),
  rodzaj: Schema.optional(QualificationKindId),
  zakres: Schema.optional(QualificationScopeId),
  krok: Schema.optional(Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 5 }))),
  egzamin: Schema.optional(ExamAccessScope),
  sesja: Schema.optional(ExamSessionId),
  terminUstnego: Schema.optional(Schema.String),
})

export type OnboardingSearch = typeof OnboardingSearch.Type

export const OnboardingFormValues = Schema.Struct({
  specjalnosc: SpecializationId,
  rodzaj: QualificationKindId,
  zakres: QualificationScopeId,
  egzamin: ExamAccessScope,
  sesja: ExamSessionId,
  terminUstnego: Schema.String.check(
    Schema.makeFilter<string>(isDateTimeInput, {
      message: 'Podaj poprawny termin egzaminu ustnego.',
    }),
  ),
})
