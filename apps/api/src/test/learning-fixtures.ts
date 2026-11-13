import { databaseLayerFromConfig } from '@inzpro/db'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { PathConfiguration } from '@inzpro/domain/modules/preparation/onboarding'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Layer, Schema, Option } from 'effect'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/exam-calendar.repository.js'
import { ExamCalendarRepositoryLive } from '~api/modules/exam-calendar/exam-calendar.repository.postgres.js'
import { LearningContentRepository } from '~api/modules/learning-content/learning-content.repository.js'
import { LearningContentRepositoryLive } from '~api/modules/learning-content/learning-content.repository.postgres.js'
import { NewQuestion } from '~api/modules/learning-content/question.model.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/qualification-paths.reader.js'
import { QualificationPathsReaderLive } from '~api/modules/qualification-paths/qualification-paths.reader.postgres.js'
import { StudyRepository } from '~api/modules/study/study.repository.js'
import { StudyRepositoryLive } from '~api/modules/study/study.repository.postgres.js'

import { technicalConfiguration } from './preparation.js'

const fixturesLayer = Layer.mergeAll(
  LearningContentRepositoryLive,
  QualificationPathsReaderLive,
  ExamCalendarRepositoryLive,
  StudyRepositoryLive,
).pipe(Layer.provide(databaseLayerFromConfig))

export const runFixture = <A, E>(
  operation: Effect.Effect<
    A,
    E,
    LearningContentRepository | QualificationPathsReader | ExamCalendarRepository | StudyRepository
  >,
) => Effect.runPromise(operation.pipe(Effect.provide(fixturesLayer), Effect.scoped))

export const createStudyFixture = (specializationId = '60000000-0000-4000-8000-000000000003') =>
  runFixture(
    Effect.gen(function* () {
      const qualificationPathsReader = yield* QualificationPathsReader
      const learningContentRepository = yield* LearningContentRepository
      const documentId = yield* Schema.decodeEffect(ReferenceDocumentId)(crypto.randomUUID())

      const config = yield* Schema.decodeUnknownEffect(PathConfiguration)({
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
