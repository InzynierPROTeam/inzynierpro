import type { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type {
  ExamBlueprintId,
  ExamBlueprintVersion,
  ExamDurationMinutes,
  ExamSectionName,
  ExamSectionPosition,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import type {
  AttemptQuestionPosition,
  MockExamAttemptId,
  MockExamAttemptStatus,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'

export type MockExamAttemptSummary = {
  readonly id: MockExamAttemptId
  readonly status: MockExamAttemptStatus
  readonly startedAt: DateTimeUtc
}

export type AttemptSection = {
  readonly position: ExamSectionPosition
  readonly name: ExamSectionName
  readonly questionCount: QuestionCount
}

export type AttemptQuestion = {
  readonly position: AttemptQuestionPosition
  readonly section: ExamSectionPosition
  readonly questionId: WrittenQuestionId
  readonly questionRevisionId: QuestionRevisionId
  readonly body: string
  readonly answers: ReadonlyArray<{ readonly id: QuestionAnswerId; readonly text: string }>
  readonly isWithdrawn: boolean
}

export type MockExamAttempt = MockExamAttemptSummary & {
  readonly durationMinutes: ExamDurationMinutes
  readonly passThreshold: QuestionCount
  readonly questionCount: QuestionCount
  readonly sections: ReadonlyArray<AttemptSection>
}

export type ExamCandidate = {
  readonly section: ExamSectionPosition
  readonly questionId: WrittenQuestionId
  readonly questionRevisionId: QuestionRevisionId
}

export type CandidateAnswer = {
  readonly questionRevisionId: QuestionRevisionId
  readonly answerId: QuestionAnswerId
}

export type DrawnQuestion = ExamCandidate & {
  readonly answerIds: ReadonlyArray<QuestionAnswerId>
}

export type NewMockExamAttempt = {
  readonly userId: UserId
  readonly qualificationPathId: QualificationPathId
  readonly blueprintId: ExamBlueprintId
  readonly blueprintVersion: ExamBlueprintVersion
  readonly startedAt: DateTimeUtc
  readonly questions: ReadonlyArray<DrawnQuestion>
}
