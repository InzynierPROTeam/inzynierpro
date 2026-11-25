import { Schema } from 'effect'

export const writtenExamAccess = 'written'
export const oralExamAccess = 'oral'
export const bothExamAccess = 'both'
export const examAccessScopeValues = [writtenExamAccess, oralExamAccess, bothExamAccess] as const
export const ExamAccessScope = Schema.Literals(examAccessScopeValues)

export type ExamAccessScope = typeof ExamAccessScope.Type

export const examPartValues = [writtenExamAccess, oralExamAccess] as const
export const ExamPart = Schema.Literals(examPartValues)

export type ExamPart = typeof ExamPart.Type

export const includesExamPart = (scope: ExamAccessScope, part: ExamPart) =>
  scope === bothExamAccess || scope === part
