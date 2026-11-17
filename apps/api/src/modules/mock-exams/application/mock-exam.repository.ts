import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import type { ExamBlueprintId } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import type {
  AttemptQuestionPosition,
  AttemptQuestionVersion,
  MockExamAttemptId,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type DateTime, type Effect, type Option } from 'effect'
import type { MockExamWriteError } from '~api/modules/mock-exams/application/errors.js'
import type { NewExamBlueprintVersion } from '~api/modules/mock-exams/domain/exam-blueprint.model.js'
import type {
  AttemptClock,
  AttemptEnding,
  MockExamResult,
} from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'
import type { NewMockExamAttempt } from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'

export class MockExamRepository extends Context.Service<
  MockExamRepository,
  {
    readonly abandonAttempt: (
      attemptId: MockExamAttemptId,
      ending: AttemptEnding,
    ) => Effect.Effect<void, MockExamWriteError>
    readonly finishAttempt: (
      attemptId: MockExamAttemptId,
      ending: AttemptEnding,
      result: MockExamResult,
    ) => Effect.Effect<void, MockExamWriteError>
    readonly createBlueprint: (
      blueprintId: ExamBlueprintId,
    ) => Effect.Effect<void, MockExamWriteError>
    readonly lockBlueprint: (
      blueprintId: ExamBlueprintId,
    ) => Effect.Effect<void, MockExamWriteError>
    readonly insertBlueprintVersion: (
      version: NewExamBlueprintVersion,
    ) => Effect.Effect<void, MockExamWriteError>
    readonly assignBlueprint: (
      pathId: QualificationPathId,
      blueprintId: ExamBlueprintId,
    ) => Effect.Effect<void, MockExamWriteError>
    readonly createAttempt: (
      attempt: NewMockExamAttempt,
    ) => Effect.Effect<MockExamAttemptId, MockExamWriteError>
    readonly lockAttempt: (
      userId: UserId,
      pathId: QualificationPathId,
      attemptId: MockExamAttemptId,
    ) => Effect.Effect<Option.Option<AttemptClock>, MockExamWriteError>
    readonly pauseAttempt: (
      attemptId: MockExamAttemptId,
      pausedAt: DateTime.Utc,
    ) => Effect.Effect<void, MockExamWriteError>
    readonly resumeAttempt: (
      attemptId: MockExamAttemptId,
      resumedAt: DateTime.Utc,
    ) => Effect.Effect<void, MockExamWriteError>
    readonly saveAttemptAnswer: (
      attemptId: MockExamAttemptId,
      position: AttemptQuestionPosition,
      answerId: QuestionAnswerId,
      version: AttemptQuestionVersion,
    ) => Effect.Effect<void, MockExamWriteError>
    readonly flagAttemptQuestion: (
      attemptId: MockExamAttemptId,
      position: AttemptQuestionPosition,
      isFlagged: boolean,
      version: AttemptQuestionVersion,
    ) => Effect.Effect<void, MockExamWriteError>
  }
>()('api/modules/mock-exams/MockExamRepository') {}
