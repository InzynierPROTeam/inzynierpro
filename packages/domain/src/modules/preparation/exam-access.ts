import { Schema } from 'effect'

export const writtenExamAccess = 'written'
export const oralExamAccess = 'oral'
export const bothExamAccess = 'both'
export const examAccessScopeValues = [writtenExamAccess, oralExamAccess, bothExamAccess] as const
export const ExamAccessScope = Schema.Literals(examAccessScopeValues)

export type ExamAccessScope = typeof ExamAccessScope.Type
