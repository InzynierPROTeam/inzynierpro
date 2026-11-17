import type { MockExamUnavailableReason } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import { Data } from 'effect'
import type { InvalidExamBlueprintReason } from '~api/modules/mock-exams/domain/exam-blueprint.model.js'
import type { AttemptQuestion } from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'

export class InvalidExamBlueprint extends Data.TaggedError('InvalidExamBlueprint')<{
  readonly reason: InvalidExamBlueprintReason
}> {}

export class ExamBlueprintNotFound extends Data.TaggedError('ExamBlueprintNotFound') {}

export class MockExamUnavailable extends Data.TaggedError('MockExamUnavailable')<{
  readonly reason: MockExamUnavailableReason
}> {}

export class MockExamAttemptNotFound extends Data.TaggedError('MockExamAttemptNotFound') {}

export class AttemptQuestionNotFound extends Data.TaggedError('AttemptQuestionNotFound') {}

export class MockExamAttemptNotInProgress extends Data.TaggedError(
  'MockExamAttemptNotInProgress',
) {}

export class MockExamAttemptPaused extends Data.TaggedError('MockExamAttemptPaused') {}

export class AttemptQuestionWithdrawn extends Data.TaggedError('AttemptQuestionWithdrawn') {}

export class InvalidAttemptAnswer extends Data.TaggedError('InvalidAttemptAnswer') {}

export class AttemptDeadlineNotReached extends Data.TaggedError('AttemptDeadlineNotReached') {}

export class AttemptQuestionConflict extends Data.TaggedError('AttemptQuestionConflict')<{
  readonly current: AttemptQuestion
}> {}
