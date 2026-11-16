import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const OralSessionQuizId = Uuid.pipe(Schema.brand('OralSessionQuizId'))

export type OralSessionQuizId = typeof OralSessionQuizId.Type

export const OralQuizCheckPosition = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('OralQuizCheckPosition'),
)

export type OralQuizCheckPosition = typeof OralQuizCheckPosition.Type
