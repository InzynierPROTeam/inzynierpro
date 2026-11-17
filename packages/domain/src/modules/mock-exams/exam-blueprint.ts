import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const ExamBlueprintId = Uuid.pipe(Schema.brand('ExamBlueprintId'))

export type ExamBlueprintId = typeof ExamBlueprintId.Type

export const ExamBlueprintVersion = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('ExamBlueprintVersion'),
)

export type ExamBlueprintVersion = typeof ExamBlueprintVersion.Type

export const firstExamBlueprintVersion = ExamBlueprintVersion.make(1)

export const nextExamBlueprintVersion = (version: ExamBlueprintVersion) =>
  ExamBlueprintVersion.make(version + 1)

export const ExamDurationMinutes = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('ExamDurationMinutes'),
)

export type ExamDurationMinutes = typeof ExamDurationMinutes.Type

export const ExamSectionPosition = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('ExamSectionPosition'),
)

export type ExamSectionPosition = typeof ExamSectionPosition.Type

export const ExamSectionName = Schema.NonEmptyString.pipe(Schema.brand('ExamSectionName'))

export type ExamSectionName = typeof ExamSectionName.Type

export const noExamBlueprint = 'no-blueprint'
export const tooFewExamQuestions = 'too-few-questions'
export const mockExamUnavailableReasonValues = [noExamBlueprint, tooFewExamQuestions] as const

export const MockExamUnavailableReason = Schema.Literals(mockExamUnavailableReasonValues)

export type MockExamUnavailableReason = typeof MockExamUnavailableReason.Type
