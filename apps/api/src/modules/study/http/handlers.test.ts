import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  SessionPreview,
  DocumentResponse,
  DocumentsResponse,
  SessionQuestion,
  StudySession,
} from '@inzpro/api-contracts/modules/study/responses'
import {
  WrittenQuestionId,
  QuestionRevisionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Schema } from 'effect'
import { beforeAll, afterAll, expect, test } from 'vitest'
import { StudyRepository } from '~api/modules/study/application/study.repository.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import {
  createStudyFixture,
  addFixtureQuestion,
  runFixture,
  withdrawFixtureRevision,
} from '~api/test/learning-fixtures.js'
import {
  loginForPreparation,
  learningRequest,
  technicalConfiguration,
  technicalPathA,
  technicalPathB,
  technicalDocumentA,
  technicalDocumentB,
} from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

test('private material routes require authentication', async () => {
  const guest = api.visitor()

  for (const path of [
    `/paths/${technicalPathA}/documents`,
    `/paths/${technicalPathA}/documents/${technicalDocumentA}`,
    `/paths/${technicalPathA}/preview?documentId=${technicalDocumentA}`,
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
        yield* Schema.decodeEffect(QuestionRevisionId)('43000000-0000-4000-8000-000000000001'),
      )
    }),
  )

  const first = Schema.decodeUnknownSync(DocumentsResponse)(
    await (await request(`/paths/${technicalPathA}/documents?limit=1`)).json(),
  )

  expect(first.data).toMatchObject([
    { id: technicalDocumentA, availableQuestionCount: 5, completedQuestionCount: 1 },
  ])
  expect(first.meta.hasMore).toBe(true)
  expect(first.meta.nextCursor).toEqual(expect.any(String))

  const second = await (
    await request(
      `/paths/${technicalPathA}/documents?limit=1&cursor=${encodeURIComponent(first.meta.nextCursor ?? '')}`,
    )
  ).json()

  expect(second).toMatchObject({
    data: [{ id: technicalDocumentB, availableQuestionCount: 5, completedQuestionCount: 0 }],
    meta: { hasMore: false },
  })
  expect(
    await (await learningRequest(api, other, `/paths/${technicalPathA}/documents`)).json(),
  ).toMatchObject({ data: [{ completedQuestionCount: 0 }, { completedQuestionCount: 0 }] })
  expect((await request(`/paths/${technicalPathA}/documents?cursor=invalid`)).status).toBe(400)
  expect((await request(`/paths/${technicalPathA}/documents?limit=101`)).status).toBe(400)

  const preview = Schema.decodeUnknownSync(SessionPreview)(
    await (
      await request(`/paths/${technicalPathA}/preview?documentId=${technicalDocumentA}`)
    ).json(),
  )

  // One of the five questions is answered, so the next session offers the other four.
  expect(preview).toMatchObject({ questionSelection: 'unanswered', availableQuestionCount: 4 })
  expect(preview.settings).toEqual({
    defaultQuestionCount: 4,
    canChangeQuestionCount: false,
    minimumQuestionCount: 4,
    maximumQuestionCount: 4,
  })
  expect(
    (await request(`/paths/${technicalPathB}/preview?documentId=${technicalDocumentB}`)).status,
  ).toBe(403)

  const absentPreview = await request(
    `/paths/${technicalPathA}/preview?documentId=20000000-0000-4000-8000-000000000099`,
  )

  expect(absentPreview.status).toBe(200)
  expect(await absentPreview.json()).toBeNull()
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
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const preview = async () =>
    Schema.decodeUnknownSync(SessionPreview)(
      await (
        await learningRequest(
          api,
          visitor,
          `/paths/${fixture.pathId}/preview?documentId=${fixture.documentId}`,
        )
      ).json(),
    )

  expect((await preview()).settings).toEqual({
    defaultQuestionCount: 0,
    canChangeQuestionCount: false,
    minimumQuestionCount: 0,
    maximumQuestionCount: 0,
  })
  expect(
    await (await learningRequest(api, visitor, `/paths/${fixture.pathId}/preview`)).json(),
  ).toMatchObject({ document: { id: technicalDocumentA }, availableQuestionCount: 5 })

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

  for (const question of questions) {
    await withdrawFixtureRevision(question.revisionId)
  }

  expect((await preview()).availableQuestionCount).toBe(0)
  expect(
    await (await learningRequest(api, visitor, `/paths/${fixture.pathId}/preview`)).json(),
  ).toMatchObject({ document: { id: technicalDocumentA }, availableQuestionCount: 5 })
})

test('category details are a private point lookup without preview settings', async () => {
  const visitor = await loginForPreparation(api)
  const other = await loginForPreparation(api)
  await learningRequest(api, visitor, '/onboarding', technicalConfiguration)
  const url = `/paths/${technicalPathA}/documents/${technicalDocumentA}`
  const response = await learningRequest(api, visitor, url)
  expect(response.status).toBe(200)
  const detail = Schema.decodeUnknownSync(DocumentResponse)(await response.json())
  expect(detail.document).toMatchObject({
    id: technicalDocumentA,
    availableQuestionCount: 5,
    completedQuestionCount: 0,
  })
  expect(Object.keys(detail)).toEqual(['document'])
  expect((await learningRequest(api, other, url)).status).toBe(403)
  expect(
    (
      await learningRequest(
        api,
        visitor,
        `/paths/${technicalPathB}/documents/${technicalDocumentA}`,
      )
    ).status,
  ).toBe(403)
  expect(
    (
      await learningRequest(
        api,
        visitor,
        `/paths/${technicalPathA}/documents/20000000-0000-4000-8000-000000000099`,
      )
    ).status,
  ).toBe(404)
  expect(
    (await learningRequest(api, visitor, `/paths/${technicalPathA}/documents/invalid`)).status,
  ).toBe(400)
  await learningRequest(api, visitor, `/paths/${technicalPathA}/archive`, {})
  expect((await learningRequest(api, visitor, url)).status).toBe(403)
})

test('preview continues from a category until its questions are answered, then moves to the next', async () => {
  const visitor = await loginForPreparation(api)
  await learningRequest(api, visitor, '/onboarding', technicalConfiguration)

  const preview = async (query = '') =>
    learningRequest(api, visitor, `/paths/${technicalPathA}/preview${query}`)

  expect(await (await preview()).json()).toMatchObject({
    document: { id: technicalDocumentA },
    questionSelection: 'unanswered',
  })
  expect(await (await preview(`?fromDocumentId=${technicalDocumentA}`)).json()).toMatchObject({
    document: { id: technicalDocumentA },
  })
  expect(await (await preview(`?fromDocumentId=${technicalDocumentB}`)).json()).toMatchObject({
    document: { id: technicalDocumentB },
  })

  // Answering every question of the first category moves study on to the next one.
  const session = Schema.decodeUnknownSync(StudySession)(
    await (
      await learningRequest(api, visitor, `/paths/${technicalPathA}/sessions`, {
        documentId: technicalDocumentA,
        questionCount: 5,
        questionSelection: 'unanswered',
      })
    ).json(),
  )

  for (const position of [1, 2, 3, 4, 5]) {
    const question = Schema.decodeUnknownSync(SessionQuestion)(
      await (
        await learningRequest(
          api,
          visitor,
          `/paths/${technicalPathA}/sessions/${session.id}/questions/${position}`,
        )
      ).json(),
    )

    await learningRequest(
      api,
      visitor,
      `/paths/${technicalPathA}/sessions/${session.id}/questions/${position}/answer`,
      { questionRevisionId: question.questionRevisionId, answerId: question.answers[0]!.id },
    )
  }

  expect(await (await preview(`?fromDocumentId=${technicalDocumentA}`)).json()).toMatchObject({
    document: { id: technicalDocumentB },
    questionSelection: 'unanswered',
  })
  expect(await (await preview()).json()).toMatchObject({ document: { id: technicalDocumentB } })
  // The answered category itself offers to repeat its questions.
  expect(await (await preview(`?documentId=${technicalDocumentA}`)).json()).toMatchObject({
    document: { id: technicalDocumentA },
    questionSelection: 'repeat',
    availableQuestionCount: 5,
  })
  expect((await preview('?documentId=invalid')).status).toBe(400)
  expect((await preview('?fromDocumentId=invalid')).status).toBe(400)
  expect(
    await (
      await preview(`?documentId=${technicalDocumentA}&fromDocumentId=${technicalDocumentB}`)
    ).json(),
  ).toMatchObject({ document: { id: technicalDocumentA } })
})

test('once every category is answered, study continues in order from the category after', async () => {
  const visitor = await loginForPreparation(api)
  await learningRequest(api, visitor, '/onboarding', technicalConfiguration)

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${technicalPathA}${path}`, body)

  const preview = async (query = '') =>
    Schema.decodeUnknownSync(SessionPreview)(await (await request(`/preview${query}`)).json())

  // Answers every question of a category in one session and ends it.
  const answerCategory = async (documentId: string) => {
    const offered = await preview(`?documentId=${documentId}`)

    const session = Schema.decodeUnknownSync(StudySession)(
      await (
        await request('/sessions', {
          documentId,
          questionCount: offered.settings.defaultQuestionCount,
          questionSelection: offered.questionSelection,
        })
      ).json(),
    )

    for (let position = 1; position <= session.progress.total; position++) {
      const question = Schema.decodeUnknownSync(SessionQuestion)(
        await (await request(`/sessions/${session.id}/questions/${position}`)).json(),
      )

      await request(`/sessions/${session.id}/questions/${position}/answer`, {
        questionRevisionId: question.questionRevisionId,
        answerId: question.answers[0]!.id,
      })
    }

    await request(`/sessions/${session.id}/end`, {})
  }

  await answerCategory(technicalDocumentA)
  await answerCategory(technicalDocumentB)

  // Every question of the path is answered: after the last category study starts from the first.
  expect(await preview(`?fromDocumentId=${technicalDocumentB}`)).toMatchObject({
    document: { id: technicalDocumentA },
    questionSelection: 'repeat',
  })
  expect(await preview(`?fromDocumentId=${technicalDocumentA}`)).toMatchObject({
    document: { id: technicalDocumentB },
    questionSelection: 'repeat',
  })
  expect(await preview()).toMatchObject({ document: { id: technicalDocumentA } })
})
