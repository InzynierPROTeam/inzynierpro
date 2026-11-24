import { Schema } from 'effect'

export const directBasisReference = 'direct_basis'
export const aidReference = 'aid'
export const topicReference = 'topic'

export const questionReferenceKindValues = [
  directBasisReference,
  aidReference,
  topicReference,
] as const

export const QuestionReferenceKind = Schema.Literals(questionReferenceKindValues)

export type QuestionReferenceKind = typeof QuestionReferenceKind.Type
