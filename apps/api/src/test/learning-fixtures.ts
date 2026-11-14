import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { databaseLayerFromConfig } from '@inzpro/db'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import type { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { StudySessionId } from '@inzpro/domain/modules/study/study-session'
import { Effect, Layer, Schema, Option } from 'effect'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/application/exam-calendar.repository.js'
import { ExamCalendarRepositoryLive } from '~api/modules/exam-calendar/infrastructure/exam-calendar.repository.postgres.js'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import {
  NewQuestion,
  NewQuestionRevision,
} from '~api/modules/learning-content/domain/learning-content.model.js'
import { LearningContentRepositoryLive } from '~api/modules/learning-content/infrastructure/learning-content.repository.postgres.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/application/qualification-paths.reader.js'
import { QualificationPathsReaderLive } from '~api/modules/qualification-paths/infrastructure/qualification-paths.reader.postgres.js'
import { StudyReader } from '~api/modules/study/application/study.reader.js'
import { StudyRepository } from '~api/modules/study/application/study.repository.js'
import { StudyReaderLive } from '~api/modules/study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/study/infrastructure/study.repository.postgres.js'

import { technicalConfiguration } from './preparation.js'

const fixturesLayer = Layer.mergeAll(
  LearningContentRepositoryLive,
  QualificationPathsReaderLive,
  ExamCalendarRepositoryLive,
  StudyRepositoryLive,
  StudyReaderLive,
).pipe(Layer.provide(databaseLayerFromConfig))

export const runFixture = <A, E>(
  operation: Effect.Effect<
    A,
    E,
    | LearningContentRepository
    | QualificationPathsReader
    | ExamCalendarRepository
    | StudyRepository
    | StudyReader
  >,
) => Effect.runPromise(operation.pipe(Effect.provide(fixturesLayer), Effect.scoped))

// A seeded path the session and answer tests give their own fresh documents. They never read its
// first-document preview, so the documents they add cannot disturb one another.
export const studySessionSpecialization = '60000000-0000-4000-8000-000000000011'

export const createStudyFixture = (specializationId = '60000000-0000-4000-8000-000000000003') =>
  runFixture(
    Effect.gen(function* () {
      const qualificationPathsReader = yield* QualificationPathsReader
      const learningContentRepository = yield* LearningContentRepository
      const documentId = yield* Schema.decodeEffect(ReferenceDocumentId)(crypto.randomUUID())

      const config = yield* Schema.decodeUnknownEffect(CompleteOnboardingPayload)({
        ...technicalConfiguration,
        specializationId,
      })

      const path = yield* qualificationPathsReader.resolve(config)

      const { id: pathId } = yield* Option.match(path, {
        onNone: () => Effect.die(new Error('Missing seeded fixture path')),
        onSome: Effect.succeed,
      })

      yield* learningContentRepository.createDocument({
        id: documentId,
        title: 'Test-only threshold document',
      })
      yield* learningContentRepository.attachDocument(pathId, documentId)

      return { pathId, documentId, config }
    }),
  )

export const addFixtureQuestion = (
  pathId: QualificationPathId,
  documentId: ReferenceDocumentId,
  published = true,
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      const revisionId = crypto.randomUUID()

      const question = yield* Schema.decodeEffect(NewQuestion)({
        id: crypto.randomUUID(),
        revisionId,
        documentId,
        qualificationPathId: pathId,
        body: 'Test-only question',
        answers: [
          {
            id: crypto.randomUUID(),
            questionRevisionId: revisionId,
            text: 'A',
            isCorrect: true,
          },
          {
            id: crypto.randomUUID(),
            questionRevisionId: revisionId,
            text: 'B',
            isCorrect: false,
          },
          {
            id: crypto.randomUUID(),
            questionRevisionId: revisionId,
            text: 'C',
            isCorrect: false,
          },
        ],
        explanation: 'Fixture',
        published,
      })

      yield* learningContentRepository.createQuestion(question)

      return question
    }),
  )

// Publishes a newer revision with its own answer IDs, as an editor's substantive change would.
export const publishFixtureRevision = (questionId: WrittenQuestionId) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository
      const revisionId = crypto.randomUUID()

      const revision = yield* Schema.decodeEffect(NewQuestionRevision)({
        questionId,
        revisionId,
        body: 'Test-only revised question',
        answers: ['D', 'E', 'F'].map((text, index) => ({
          id: crypto.randomUUID(),
          questionRevisionId: revisionId,
          text,
          isCorrect: index === 0,
        })),
        explanation: 'Revised fixture',
      })

      yield* learningContentRepository.publishRevision(revision)

      return revision
    }),
  )

// The goal version a session was started under, which the API does not expose.
export const sessionGoalVersion = (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
) =>
  runFixture(
    Effect.gen(function* () {
      const studyReader = yield* StudyReader
      const session = yield* studyReader.session(userId, pathId, sessionId)

      return Option.map(session, ({ goalVersion }) => goalVersion).pipe(Option.getOrUndefined)
    }),
  )
