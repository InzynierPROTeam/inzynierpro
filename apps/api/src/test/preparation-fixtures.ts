import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { Effect, Schema, Option } from 'effect'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/application/qualification-paths.reader.js'
import { fixtureReferenceDocument } from '~api/test/content-fixtures.js'
import { runFixture } from '~api/test/run-fixture.js'

import { technicalConfiguration } from './preparation.js'

export const studySessionSpecialization = '60000000-0000-4000-8000-000000000011'

const resolveSeededPath = (configuration: typeof CompleteOnboardingPayload.Encoded) =>
  Effect.gen(function* () {
    const qualificationPathsReader = yield* QualificationPathsReader
    const config = yield* Schema.decodeEffect(CompleteOnboardingPayload)(configuration)
    const path = yield* qualificationPathsReader.resolve(config)

    const { id: pathId } = yield* Option.match(path, {
      onNone: () => Effect.die(new Error('Missing seeded fixture path')),
      onSome: Effect.succeed,
    })

    return { pathId, config }
  })

export const seededFixturePath = (configuration: typeof CompleteOnboardingPayload.Encoded) =>
  runFixture(resolveSeededPath(configuration))

export const createStudyFixture = (specializationId = '60000000-0000-4000-8000-000000000003') =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository
      const documentId = yield* Schema.decodeEffect(ReferenceDocumentId)(crypto.randomUUID())

      const { pathId, config } = yield* resolveSeededPath({
        ...technicalConfiguration,
        specializationId,
      })

      yield* learningContentRepository.createDocument(
        fixtureReferenceDocument(documentId, 'Test-only threshold document'),
      )
      yield* learningContentRepository.attachDocument(pathId, documentId)

      return { pathId, documentId, config }
    }),
  )
