import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { ExamAccessScope } from '@inzpro/domain/modules/preparation/exam-access'
import { QualificationKindId } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import { QualificationScopeId } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Schema } from 'effect'

import { maxOnboardingStep } from './config'

export const OnboardingSearch = Schema.Struct({
  specjalnosc: Schema.optional(SpecializationId),
  rodzaj: Schema.optional(QualificationKindId),
  zakres: Schema.optional(QualificationScopeId),
  krok: Schema.optional(
    Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: maxOnboardingStep })),
  ),
  egzamin: Schema.optional(ExamAccessScope),
  sesja: Schema.optional(ExamSessionId),
})

export type OnboardingSearch = typeof OnboardingSearch.Type

export const SpecializationStepValues = Schema.Struct({
  specializationId: Schema.String.check(
    Schema.makeFilter(Schema.is(SpecializationId), {
      message: 'Wybierz specjalność, aby kontynuować.',
    }),
  ).pipe(Schema.decodeTo(SpecializationId)),
})

export const KindStepValues = Schema.Struct({
  qualificationKindId: Schema.String.check(
    Schema.makeFilter(Schema.is(QualificationKindId), {
      message: 'Wybierz rodzaj uprawnień, aby kontynuować.',
    }),
  ).pipe(Schema.decodeTo(QualificationKindId)),
})

export const ScopeStepValues = Schema.Struct({
  qualificationScopeId: Schema.String.check(
    Schema.makeFilter(Schema.is(QualificationScopeId), {
      message: 'Wybierz zakres uprawnień, aby kontynuować.',
    }),
  ).pipe(Schema.decodeTo(QualificationScopeId)),
})

export const ExamStepValues = Schema.Struct({
  accessScope: Schema.String.check(
    Schema.makeFilter(Schema.is(ExamAccessScope), {
      message: 'Wybierz egzamin, do którego chcesz się przygotować.',
    }),
  ).pipe(Schema.decodeTo(ExamAccessScope)),
})

export const SessionStepValues = Schema.Struct({
  examSessionId: Schema.String.check(
    Schema.makeFilter(Schema.is(ExamSessionId), {
      message: 'Wybierz sesję egzaminacyjną, aby rozpocząć naukę.',
    }),
  ).pipe(Schema.decodeTo(ExamSessionId)),
})

export type SessionStepValues = typeof SessionStepValues.Type
