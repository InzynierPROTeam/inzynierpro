import { databaseLayerFromConfig } from '@inzpro/db'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { PathConfiguration } from '@inzpro/domain/modules/preparation/onboarding'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { QualificationScopeId } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import { Effect, Layer, Schema } from 'effect'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/exam-calendar.repository.js'
import { ExamCalendarRepositoryLive } from '~api/modules/exam-calendar/exam-calendar.repository.postgres.js'
import { LearningContentRepository } from '~api/modules/learning-content/learning-content.repository.js'
import { LearningContentRepositoryLive } from '~api/modules/learning-content/learning-content.repository.postgres.js'
import { NewQuestion } from '~api/modules/learning-content/question.model.js'
import { QualificationPathsRepository } from '~api/modules/qualification-paths/qualification-paths.repository.js'
import { QualificationPathsRepositoryLive } from '~api/modules/qualification-paths/qualification-paths.repository.postgres.js'
import { StudyRepository } from '~api/modules/study/study.repository.js'
import { StudyRepositoryLive } from '~api/modules/study/study.repository.postgres.js'

import { technicalConfiguration } from './preparation.js'

const fixturesLayer = Layer.mergeAll(
  LearningContentRepositoryLive,
  QualificationPathsRepositoryLive,
  ExamCalendarRepositoryLive,
  StudyRepositoryLive,
).pipe(Layer.provide(databaseLayerFromConfig))

export const runFixture = <A, E>(
  operation: Effect.Effect<
    A,
    E,
    | LearningContentRepository
    | QualificationPathsRepository
    | ExamCalendarRepository
    | StudyRepository
  >,
) => Effect.runPromise(operation.pipe(Effect.provide(fixturesLayer), Effect.scoped))

export const createStudyFixture = () =>
  runFixture(
    Effect.gen(function* () {
      const qualificationPathsRepository = yield* QualificationPathsRepository
      const learningContentRepository = yield* LearningContentRepository
      const pathId = yield* Schema.decodeEffect(QualificationPathId)(crypto.randomUUID())
      const scopeId = yield* Schema.decodeEffect(QualificationScopeId)(crypto.randomUUID())
      const documentId = yield* Schema.decodeEffect(ReferenceDocumentId)(crypto.randomUUID())

      const config = yield* Schema.decodeUnknownEffect(PathConfiguration)({
        ...technicalConfiguration,
        qualificationScopeId: scopeId,
      })

      yield* qualificationPathsRepository.createScope({
        id: scopeId,
        name: 'Threshold fixture scope',
      })
      yield* qualificationPathsRepository.createPath({
        id: pathId,
        name: 'Threshold fixture path',
        ...config,
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
