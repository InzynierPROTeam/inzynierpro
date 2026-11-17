import type { ExamBlueprintId } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import type { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect } from 'effect'
import type { MockExamWriteError } from '~api/modules/mock-exams/application/errors.js'
import type { NewExamBlueprintVersion } from '~api/modules/mock-exams/domain/exam-blueprint.model.js'
import type { NewMockExamAttempt } from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'

export class MockExamRepository extends Context.Service<
  MockExamRepository,
  {
    readonly transaction: <A, E, R>(
      operation: Effect.Effect<A, E, R>,
    ) => Effect.Effect<A, E | MockExamWriteError, R>
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
  }
>()('api/modules/mock-exams/MockExamRepository') {}
