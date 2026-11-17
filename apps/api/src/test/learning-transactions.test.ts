import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { databaseLayerFromConfig } from '@inzpro/db'
import { Effect, Layer, Schema } from 'effect'
import { SqlError } from 'effect/sql'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { Transaction, TransactionLive } from '~api/lib/transaction.js'
import { QuestionNotOnPath } from '~api/modules/learning/domain/errors.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'
import { OralStudyRepositoryLive } from '~api/modules/oral-study/infrastructure/oral-study.repository.postgres.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'
import { StudyRepositoryLive } from '~api/modules/written-study/infrastructure/study.repository.postgres.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { addFixtureOralCategory, addFixtureOralQuestion } from '~api/test/oral-learning-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'
import { addFixtureQuestion } from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const transactionLayer = Layer.mergeAll(
  TransactionLive,
  StudyRepositoryLive,
  OralStudyRepositoryLive,
).pipe(Layer.provide(databaseLayerFromConfig))

const errors = [
  { name: 'business', error: new QuestionNotOnPath() },
  {
    name: 'SQL',
    error: new SqlError.SqlError({
      reason: new SqlError.ConnectionError({ cause: new Error('Failure in the operation') }),
    }),
  },
]

const configuredLearner = async () => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  return { visitor, fixture }
}

test.each(errors)(
  'a written transaction rolls back and preserves the original $name error',
  async ({ error }) => {
    const { visitor, fixture } = await configuredLearner()
    const question = await addFixtureQuestion(fixture.pathId, fixture.documentId)

    const write = StudyRepository.use(studyRepository =>
      studyRepository.markFavorite(visitor.userId, question.id),
    )

    const failed = await Effect.runPromise(
      Transaction.use(transaction =>
        transaction.run(write.pipe(Effect.andThen(Effect.fail(error)))),
      ).pipe(
        Effect.match({ onFailure: failure => failure, onSuccess: () => null }),
        Effect.provide(transactionLayer),
        Effect.scoped,
      ),
    )

    expect(failed).toBe(error)
    expect(
      await (
        await learningRequest(api, visitor, `/paths/${fixture.pathId}/favorites-preview`)
      ).json(),
    ).toMatchObject({ favoriteQuestionCount: 0 })

    await Effect.runPromise(
      Transaction.use(transaction => transaction.run(write)).pipe(
        Effect.provide(transactionLayer),
        Effect.scoped,
      ),
    )

    expect(
      await (
        await learningRequest(api, visitor, `/paths/${fixture.pathId}/favorites-preview`)
      ).json(),
    ).toMatchObject({ favoriteQuestionCount: 1 })
  },
)

test.each(errors)(
  'an oral transaction rolls back and preserves the original $name error',
  async ({ error }) => {
    const { visitor, fixture } = await configuredLearner()
    const categoryId = await addFixtureOralCategory()
    const question = await addFixtureOralQuestion(fixture.pathId, categoryId, 1)

    const write = OralStudyRepository.use(oralStudyRepository =>
      oralStudyRepository.markFavorite(visitor.userId, question.id),
    )

    const failed = await Effect.runPromise(
      Transaction.use(transaction =>
        transaction.run(write.pipe(Effect.andThen(Effect.fail(error)))),
      ).pipe(
        Effect.match({ onFailure: failure => failure, onSuccess: () => null }),
        Effect.provide(transactionLayer),
        Effect.scoped,
      ),
    )

    expect(failed).toBe(error)
    expect(
      await (
        await learningRequest(api, visitor, `/paths/${fixture.pathId}/oral/favorites-preview`)
      ).json(),
    ).toMatchObject({ favoriteQuestionCount: 0 })

    await Effect.runPromise(
      Transaction.use(transaction => transaction.run(write)).pipe(
        Effect.provide(transactionLayer),
        Effect.scoped,
      ),
    )

    expect(
      await (
        await learningRequest(api, visitor, `/paths/${fixture.pathId}/oral/favorites-preview`)
      ).json(),
    ).toMatchObject({ favoriteQuestionCount: 1 })
  },
)
