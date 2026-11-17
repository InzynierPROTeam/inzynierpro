import type { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { Percent } from '@inzpro/domain/common/percent'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import {
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
import {
  AttemptQuestionPosition,
  type AttemptQuestionVersion,
  type MockExamAttemptId,
  type MockExamAttemptStatus,
  type MockExamEndReason,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import type {
  ExamActiveSeconds,
  ExamPauseCount,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { RichContent } from '@inzpro/rich-content/rich-content'
import { type Option, Schema } from 'effect'
import type { QuestionNote } from '~api/modules/learning/domain/question-note.model.js'

export type MockExamResult = {
  readonly correct: QuestionCount
  readonly incorrect: QuestionCount
  readonly unanswered: QuestionCount
  readonly percent: Percent
  readonly passed: Option.Option<boolean>
  readonly activeSeconds: ExamActiveSeconds
  readonly pauseCount: ExamPauseCount
  readonly pauseSeconds: ExamActiveSeconds
  readonly sections: ReadonlyArray<AttemptSection & { readonly correct: QuestionCount }>
}

export type AttemptReviewQuestion = AttemptQuestion & {
  readonly correctAnswerId: QuestionAnswerId
  readonly explanation: RichContent
  readonly isFavorite: boolean
  readonly note: Option.Option<QuestionNote>
}

export type MockExamAttemptSummary = {
  readonly id: MockExamAttemptId
  readonly status: MockExamAttemptStatus
  readonly startedAt: DateTimeUtc
  readonly finishedAt: Option.Option<DateTimeUtc>
  readonly endReason: Option.Option<MockExamEndReason>
  readonly pauseCount: ExamPauseCount
  readonly pauseSeconds: ExamActiveSeconds
  readonly result: Option.Option<MockExamResult>
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
  readonly selectedAnswerId: Option.Option<QuestionAnswerId>
  readonly isFlagged: boolean
  readonly version: AttemptQuestionVersion
}

export type AttemptQuestionState = {
  readonly position: AttemptQuestionPosition
  readonly isAnswered: boolean
  readonly isFlagged: boolean
}

export type AttemptPause = {
  readonly pausedAt: DateTimeUtc
  readonly endedAt: Option.Option<DateTimeUtc>
}

export type AttemptClock = {
  readonly status: MockExamAttemptStatus
  readonly startedAt: DateTimeUtc
  readonly durationMinutes: ExamDurationMinutes
  readonly pauses: ReadonlyArray<AttemptPause>
}

export type AttemptTiming = {
  readonly activeSeconds: ExamActiveSeconds
  readonly pauseCount: ExamPauseCount
  readonly pauseSeconds: ExamActiveSeconds
}

export type AttemptEnding = AttemptTiming & {
  readonly endReason: MockExamEndReason
  readonly finishedAt: DateTimeUtc
}

export type MockExamAttempt = MockExamAttemptSummary & {
  readonly deadline: DateTimeUtc
  readonly durationMinutes: ExamDurationMinutes
  readonly passThreshold: QuestionCount
  readonly questionCount: QuestionCount
  readonly sections: ReadonlyArray<AttemptSection>
  readonly questions: ReadonlyArray<AttemptQuestionState>
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
  readonly goalVersion: UserExamGoalVersion
  readonly startedAt: DateTimeUtc
  readonly questions: ReadonlyArray<DrawnQuestion>
}

export type AttemptScoreCounts = {
  readonly total: QuestionCount
  readonly correct: QuestionCount
  readonly unanswered: QuestionCount
  readonly withdrawn: QuestionCount
  readonly passThreshold: QuestionCount
  readonly sections: ReadonlyArray<AttemptSection & { readonly correct: QuestionCount }>
}

export const FinalAttemptAnswer = Schema.Struct({
  position: AttemptQuestionPosition,
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  isCorrect: Schema.Boolean,
  goalVersion: UserExamGoalVersion,
})

export type FinalAttemptAnswer = typeof FinalAttemptAnswer.Type
