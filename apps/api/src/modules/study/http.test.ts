import { SessionPreview } from '@inzpro/api-contracts/modules/study/responses'
import { DocumentsResponse } from '@inzpro/api-contracts/modules/study/responses'
import { databaseLayerFromConfig } from '@inzpro/db'
import {
  WrittenQuestionId,
  QuestionRevisionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import { PathConfiguration } from '@inzpro/domain/modules/preparation/onboarding'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Schema } from 'effect'
import { beforeAll, afterAll, expect, test } from 'vitest'
import { LearningContentRepository } from '~api/modules/learning-content/learning-content.repository.js'
import { seedTechnicalCatalogue } from '~api/seed/technical-catalogue.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { createStudyFixture, addFixtureQuestion, runFixture } from '~api/test/learning-fixtures.js'
import {
  loginForPreparation,
  learningRequest,
  technicalConfiguration,
  technicalPathA,
  technicalPathB,
  technicalDocumentA,
  technicalDocumentB,
} from '~api/test/preparation.js'

import { StudyRepository } from './study.repository.js'

let api: TestApi

beforeAll(async () => {
  await Effect.runPromise(
    seedTechnicalCatalogue.pipe(Effect.provide(databaseLayerFromConfig), Effect.scoped),
  )
  api = await startTestApi()
})

afterAll(() => api.close())

test('private material routes require authentication', async () => {
  const guest = api.visitor()

  for (const path of [
    `/paths/${technicalPathA}/documents`,
    `/paths/${technicalPathA}/documents/${technicalDocumentA}/preview`,
    `/paths/${technicalPathA}/oral`,
  ]) {
    expect((await learningRequest(api, guest, path)).status).toBe(401)
  }
})

test('documents return one cursor page of private coverage and archive preserves coverage', async () => {
  const visitor = await loginForPreparation(api)
  const other = await loginForPreparation(api)
  const request = <Body>(path: string, body?: Body) => learningRequest(api, visitor, path, body)
  await request('/onboarding', technicalConfiguration)
  await learningRequest(api, other, '/onboarding', technicalConfiguration)
  await runFixture(
    Effect.gen(function* () {
      const studyRepository = yield* StudyRepository
      yield* studyRepository.recordCoverage(
        visitor.userId,
        yield* Schema.decodeEffect(QualificationPathId)(technicalPathA),
        yield* Schema.decodeEffect(WrittenQuestionId)('30000000-0000-4000-8000-000000000001'),
        yield* Schema.decodeEffect(QuestionRevisionId)('41000000-0000-4000-8000-000000000001'),
      )
    }),
  )

  const first = Schema.decodeUnknownSync(DocumentsResponse)(
    await (await request(`/paths/${technicalPathA}/documents?limit=1`)).json(),
  )

  expect(first.data).toMatchObject([
    { id: technicalDocumentA, availableQuestionCount: 2, completedQuestionCount: 1 },
  ])
  expect(first.meta.hasMore).toBe(true)
  expect(first.meta.nextCursor).toBe(technicalDocumentA)

  const second = await (
    await request(`/paths/${technicalPathA}/documents?limit=1&cursor=${first.meta.nextCursor}`)
  ).json()

  expect(second).toMatchObject({
    data: [{ id: technicalDocumentB, availableQuestionCount: 1, completedQuestionCount: 0 }],
    meta: { hasMore: false },
  })
  expect(
    await (await learningRequest(api, other, `/paths/${technicalPathA}/documents`)).json(),
  ).toMatchObject({ data: [{ completedQuestionCount: 0 }, { completedQuestionCount: 0 }] })
  expect((await request(`/paths/${technicalPathA}/documents?cursor=invalid`)).status).toBe(400)
  expect((await request(`/paths/${technicalPathA}/documents?limit=101`)).status).toBe(400)

  const preview = Schema.decodeUnknownSync(SessionPreview)(
    await (
      await request(`/paths/${technicalPathA}/documents/${technicalDocumentA}/preview`)
    ).json(),
  )

  expect(preview.settings).toEqual({
    defaultQuestionCount: 2,
    canChangeQuestionCount: false,
    minimumQuestionCount: 2,
    maximumQuestionCount: 2,
  })
  expect(
    (await request(`/paths/${technicalPathB}/documents/${technicalDocumentB}/preview`)).status,
  ).toBe(403)
  expect(
    (
      await request(
        `/paths/${technicalPathA}/documents/20000000-0000-4000-8000-000000000099/preview`,
      )
    ).status,
  ).toBe(404)
  await request(`/paths/${technicalPathA}/archive`, {})
  expect((await request(`/paths/${technicalPathA}/documents`)).status).toBe(403)
  await request(`/paths/${technicalPathA}/restore`, {})
  expect(await (await request(`/paths/${technicalPathA}/documents`)).json()).toMatchObject({
    data: [{ completedQuestionCount: 1 }, { completedQuestionCount: 0 }],
  })
})

test('preview reads exactly one document and applies the 25/26 threshold while excluding drafts and withdrawals', async () => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture()
  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(PathConfiguration)(fixture.config),
  )

  const preview = async () =>
    Schema.decodeUnknownSync(SessionPreview)(
      await (
        await learningRequest(
          api,
          visitor,
          `/paths/${fixture.pathId}/documents/${fixture.documentId}/preview`,
        )
      ).json(),
    )

  expect((await preview()).settings).toEqual({
    defaultQuestionCount: 0,
    canChangeQuestionCount: false,
    minimumQuestionCount: 0,
    maximumQuestionCount: 0,
  })
  const questions: Array<Awaited<ReturnType<typeof addFixtureQuestion>>> = []

  for (let index = 0; index < 25; index++) {
    questions.push(await addFixtureQuestion(fixture.pathId, fixture.documentId))
  }

  expect((await preview()).settings).toEqual({
    defaultQuestionCount: 25,
    canChangeQuestionCount: false,
    minimumQuestionCount: 25,
    maximumQuestionCount: 25,
  })
  questions.push(await addFixtureQuestion(fixture.pathId, fixture.documentId))
  await addFixtureQuestion(fixture.pathId, fixture.documentId, false)
  expect((await preview()).settings).toEqual({
    defaultQuestionCount: 26,
    canChangeQuestionCount: true,
    minimumQuestionCount: 1,
    maximumQuestionCount: 26,
  })
  await runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      for (const question of questions) {
        yield* learningContentRepository.withdrawRevision(question.revisionId)
      }
    }),
  )
  expect((await preview()).availableQuestionCount).toBe(0)
})
