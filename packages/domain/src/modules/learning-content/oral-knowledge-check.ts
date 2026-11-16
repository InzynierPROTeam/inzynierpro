import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const OralKnowledgeCheckId = Uuid.pipe(Schema.brand('OralKnowledgeCheckId'))

export type OralKnowledgeCheckId = typeof OralKnowledgeCheckId.Type

export const OralKnowledgeCheckRevisionId = Uuid.pipe(Schema.brand('OralKnowledgeCheckRevisionId'))

export type OralKnowledgeCheckRevisionId = typeof OralKnowledgeCheckRevisionId.Type

export const OralKnowledgeCheckOptionId = Uuid.pipe(Schema.brand('OralKnowledgeCheckOptionId'))

export type OralKnowledgeCheckOptionId = typeof OralKnowledgeCheckOptionId.Type

export const singleChoiceFormat = 'single_choice'
export const trueFalseFormat = 'true_false'
export const multipleChoiceFormat = 'multiple_choice'

export const knowledgeCheckFormatValues = [
  singleChoiceFormat,
  trueFalseFormat,
  multipleChoiceFormat,
] as const

export const KnowledgeCheckFormat = Schema.Literals(knowledgeCheckFormatValues)

export type KnowledgeCheckFormat = typeof KnowledgeCheckFormat.Type

export const allowsSeveralOptions = (format: KnowledgeCheckFormat): boolean =>
  format === multipleChoiceFormat

export const knowledgeCheckOptionCounts = {
  [singleChoiceFormat]: 3,
  [trueFalseFormat]: 2,
  [multipleChoiceFormat]: 4,
} as const satisfies Record<KnowledgeCheckFormat, number>

export const hasFormatOptionCount = (format: KnowledgeCheckFormat, optionCount: number): boolean =>
  optionCount === knowledgeCheckOptionCounts[format]
