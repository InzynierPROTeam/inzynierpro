import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const ReferenceDocumentId = Uuid.pipe(Schema.brand('ReferenceDocumentId'))

export type ReferenceDocumentId = typeof ReferenceDocumentId.Type

export const ReferenceDocumentCode = Schema.String.check(
  Schema.isPattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  Schema.isMaxLength(80),
).pipe(Schema.brand('ReferenceDocumentCode'))

export type ReferenceDocumentCode = typeof ReferenceDocumentCode.Type

export const statuteDocument = 'statute'
export const regulationDocument = 'regulation'
export const standardDocument = 'standard'
export const codeDocument = 'code'
export const manualDocument = 'manual'
export const guidelineDocument = 'guideline'

export const referenceDocumentKindValues = [
  statuteDocument,
  regulationDocument,
  standardDocument,
  codeDocument,
  manualDocument,
  guidelineDocument,
] as const

export const ReferenceDocumentKind = Schema.Literals(referenceDocumentKindValues)

export type ReferenceDocumentKind = typeof ReferenceDocumentKind.Type

export const PathDocumentPosition = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('PathDocumentPosition'),
)

export type PathDocumentPosition = typeof PathDocumentPosition.Type

export const QuestionCount = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).pipe(
  Schema.brand('QuestionCount'),
)

export type QuestionCount = typeof QuestionCount.Type
