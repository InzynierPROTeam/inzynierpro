import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import type {
  ExamBlueprintId,
  ExamBlueprintVersion,
  ExamDurationMinutes,
  ExamSectionName,
  ExamSectionPosition,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import { Schema } from 'effect'

export type ExamSectionDraft = {
  readonly name: ExamSectionName
  readonly questionCount: QuestionCount
  readonly documentIds: ReadonlyArray<ReferenceDocumentId>
}

export type ExamBlueprintDraft = {
  readonly durationMinutes: ExamDurationMinutes
  readonly passThreshold: QuestionCount
  readonly sections: ReadonlyArray<ExamSectionDraft>
}

export type NewExamBlueprintVersion = ExamBlueprintDraft & {
  readonly blueprintId: ExamBlueprintId
  readonly version: ExamBlueprintVersion
}

export type ExamSectionDocument = {
  readonly id: ReferenceDocumentId
  readonly title: string
}

export type ExamBlueprintSection = {
  readonly position: ExamSectionPosition
  readonly name: ExamSectionName
  readonly questionCount: QuestionCount
  readonly documents: ReadonlyArray<ExamSectionDocument>
}

export type ExamBlueprint = {
  readonly id: ExamBlueprintId
  readonly version: ExamBlueprintVersion
  readonly durationMinutes: ExamDurationMinutes
  readonly passThreshold: QuestionCount
  readonly sections: ReadonlyArray<ExamBlueprintSection>
}

export type ExamSectionEligibility = {
  readonly position: ExamSectionPosition
  readonly availableQuestionCount: QuestionCount
}

export const noExamSections = 'no-sections'
export const emptyExamSection = 'empty-section'
export const examThresholdOutOfRange = 'threshold-out-of-range'
export const examSharedDocument = 'shared-document'
export const examDocumentOutsidePath = 'document-outside-path'

export const invalidExamBlueprintReasonValues = [
  noExamSections,
  emptyExamSection,
  examThresholdOutOfRange,
  examSharedDocument,
  examDocumentOutsidePath,
] as const

export const InvalidExamBlueprintReason = Schema.Literals(invalidExamBlueprintReasonValues)

export type InvalidExamBlueprintReason = typeof InvalidExamBlueprintReason.Type

export type ExamBlueprintPreview = Omit<ExamBlueprint, 'sections'> & {
  readonly sections: ReadonlyArray<
    ExamBlueprintSection & { readonly availableQuestionCount: QuestionCount }
  >
}
