import {
  QuestionCount,
  type ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import {
  type MockExamUnavailableReason,
  noExamBlueprint,
  tooFewExamQuestions,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import { Array as Arr, Option } from 'effect'
import {
  emptyExamSection,
  examDocumentOutsidePath,
  examSharedDocument,
  examThresholdOutOfRange,
  type ExamBlueprintDraft,
  type InvalidExamBlueprintReason,
  noExamSections,
} from '~api/modules/mock-exams/domain/exam-blueprint.model.js'

export const blueprintQuestionCount = (
  sections: ReadonlyArray<{ readonly questionCount: QuestionCount }>,
): QuestionCount =>
  QuestionCount.make(sections.reduce((total, section) => total + section.questionCount, 0))

export const examBlueprintViolation = (
  draft: ExamBlueprintDraft,
  documentsOfAssignedPaths: ReadonlyArray<ReadonlyArray<ReferenceDocumentId>>,
): Option.Option<InvalidExamBlueprintReason> => {
  if (!Arr.isReadonlyArrayNonEmpty(draft.sections)) {
    return Option.some(noExamSections)
  }

  if (
    draft.sections.some(section => section.questionCount < 1 || section.documentIds.length === 0)
  ) {
    return Option.some(emptyExamSection)
  }

  if (draft.passThreshold < 1 || draft.passThreshold > blueprintQuestionCount(draft.sections)) {
    return Option.some(examThresholdOutOfRange)
  }

  const documentIds = draft.sections.flatMap(section => section.documentIds)

  if (new Set(documentIds).size < documentIds.length) {
    return Option.some(examSharedDocument)
  }

  return documentsOfAssignedPaths.every(onPath => documentIds.every(id => onPath.includes(id)))
    ? Option.none()
    : Option.some(examDocumentOutsidePath)
}

export const examUnavailableReason = (
  blueprint: Option.Option<{
    readonly sections: ReadonlyArray<{
      readonly questionCount: QuestionCount
      readonly availableQuestionCount: QuestionCount
    }>
  }>,
): Option.Option<MockExamUnavailableReason> =>
  Option.match(blueprint, {
    onNone: () => Option.some(noExamBlueprint),
    onSome: ({ sections }) =>
      sections.some(section => section.availableQuestionCount < section.questionCount)
        ? Option.some(tooFewExamQuestions)
        : Option.none(),
  })
