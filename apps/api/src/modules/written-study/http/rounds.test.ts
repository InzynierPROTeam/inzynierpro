import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  DocumentQuestionPool,
  DocumentResponse,
  SessionPreview,
  SessionQuestion,
  StudySession,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, onTestFinished, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import {
  learningRequest,
  loginForPreparation,
  technicalDocumentA,
  technicalDocumentB,
} from '~api/test/preparation.js'
import {
  addFixtureQuestion,
  publishFixtureRevision,
  storedLearningRound,
  withdrawFixtureRevision,
} from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const roundPathSpecializations = {
  completion: '60000000-0000-4000-8000-000000000004',
  withdrawal: '60000000-0000-4000-8000-000000000005',
}

const learnerOnPath = async (specializationId: string, questionCount = 0) => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(specializationId)
  const questions: Array<Awaited<ReturnType<typeof addFixtureQuestion>>> = []

  for (let index = 0; index < questionCount; index++) {
    questions.push(await addFixtureQuestion(fixture.pathId, fixture.documentId))
  }

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${fixture.pathId}${path}`, body)

  const preview = async (query = '') =>
    Schema.decodeUnknownSync(SessionPreview)(await (await request(`/preview${query}`)).json())

  const documents = async () =>
    Schema.decodeUnknownSync(Schema.Struct({ data: Schema.Array(DocumentQuestionPool) }))(
      await (await request('/documents?limit=100')).json(),
    ).data

  const documentProgress = async (documentId: string) =>
    Schema.decodeUnknownSync(DocumentResponse)(
      await (await request(`/documents/${documentId}`)).json(),
    ).document

  const start = async (documentId: string) => {
    const offered = await preview(`?documentId=${documentId}`)

    return Schema.decodeUnknownSync(StudySession)(
      await (
        await request('/sessions', {
          documentId,
          questionCount: offered.settings.defaultQuestionCount,
          questionSelection: offered.questionSelection,
        })
      ).json(),
    )
  }

  const question = async (sessionId: string, position: number) =>
    Schema.decodeUnknownSync(SessionQuestion)(
      await (await request(`/sessions/${sessionId}/questions/${position}`)).json(),
    )

  const answer = async (sessionId: string, position: number) => {
    const shown = await question(sessionId, position)

    return request(`/sessions/${sessionId}/questions/${position}/answer`, {
      questionRevisionId: shown.questionRevisionId,
      answerId: shown.answers[0]!.id,
    })
  }

  const coverDocument = async (documentId: string) => {
    const session = await start(documentId)

    for (let position = 1; position <= session.progress.total; position++) {
      await answer(session.id, position)
    }

    await request(`/sessions/${session.id}/end`, {})
  }

  const coverPathExcept = async (...kept: ReadonlyArray<string>) => {
    for (const document of await documents()) {
      if (!kept.includes(document.id) && document.availableQuestionCount > 0) {
        await coverDocument(document.id)
      }
    }
  }

  const round = () => storedLearningRound(visitor.userId, fixture.pathId)

  return {
    fixture,
    questions,
    request,
    documents,
    preview,
    documentProgress,
    start,
    question,
    answer,
    coverDocument,
    coverPathExcept,
    round,
  }
}

test('covering the last uncovered questions concurrently advances the round once', async () => {
  const { documents, preview, start, answer, coverPathExcept, round } = await learnerOnPath(
    roundPathSpecializations.completion,
  )

  await coverPathExcept(technicalDocumentB)
  const last = await start(technicalDocumentB)

  for (const position of [1, 2, 3, 4, 5, 6]) {
    await answer(last.id, position)
  }

  expect(await round()).toBe(1)

  const responses = await Promise.all([answer(last.id, 7), answer(last.id, 8)])

  expect(responses.map(response => response.status)).toEqual([200, 200])
  expect(await round()).toBe(2)

  expect(await documents()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: technicalDocumentA,
        availableQuestionCount: 8,
        completedQuestionCount: 0,
      }),
      expect.objectContaining({
        id: technicalDocumentB,
        availableQuestionCount: 8,
        completedQuestionCount: 0,
      }),
    ]),
  )
  expect(await preview()).toMatchObject({
    document: { id: technicalDocumentA },
    questionSelection: 'uncovered',
    availableQuestionCount: 8,
  })

  const next = await start(technicalDocumentA)
  await answer(next.id, 1)

  expect(await round()).toBe(2)
  expect(await preview(`?documentId=${technicalDocumentA}`)).toMatchObject({
    questionSelection: 'uncovered',
    availableQuestionCount: 7,
  })
})

test('a question added during the round is uncovered and a withdrawn one does not block completion', async () => {
  const {
    fixture,
    questions,
    request,
    documentProgress,
    start,
    question,
    answer,
    coverPathExcept,
    round,
  } = await learnerOnPath(roundPathSpecializations.withdrawal, 2)

  await coverPathExcept(fixture.documentId)

  const partial = await start(fixture.documentId)
  await answer(partial.id, 1)

  const added = await addFixtureQuestion(fixture.pathId, fixture.documentId)

  onTestFinished(async () => {
    await withdrawFixtureRevision(questions[0]!.revisionId)
    await withdrawFixtureRevision(added.revisionId)
  })

  expect(await documentProgress(fixture.documentId)).toMatchObject({
    availableQuestionCount: 3,
    completedQuestionCount: 1,
  })

  await withdrawFixtureRevision(questions[1]!.revisionId)

  expect(await documentProgress(fixture.documentId)).toMatchObject({
    availableQuestionCount: 2,
    completedQuestionCount: 1,
  })
  expect(await round()).toBe(1)

  await request(`/sessions/${partial.id}/end`, {})

  const last = await start(fixture.documentId)

  expect(last.progress.total).toBe(1)
  expect((await question(last.id, 1)).questionId).toBe(added.id)

  await answer(last.id, 1)

  expect(await round()).toBe(2)
  expect(await documentProgress(fixture.documentId)).toMatchObject({
    availableQuestionCount: 2,
    completedQuestionCount: 0,
  })
})

test('a substantive revision uncovers the question in the current round and a cosmetic one does not', async () => {
  const { fixture, questions, preview, documentProgress, start, question, coverDocument } =
    await learnerOnPath(studySessionSpecialization, 2)

  await coverDocument(fixture.documentId)

  expect(await documentProgress(fixture.documentId)).toMatchObject({ completedQuestionCount: 2 })

  await publishFixtureRevision(questions[0]!.id, 'cosmetic')

  expect(await documentProgress(fixture.documentId)).toMatchObject({ completedQuestionCount: 2 })
  expect(await preview(`?documentId=${fixture.documentId}`)).toMatchObject({
    questionSelection: 'covered',
  })

  const substantive = await publishFixtureRevision(questions[1]!.id, 'substantive')

  expect(await documentProgress(fixture.documentId)).toMatchObject({
    availableQuestionCount: 2,
    completedQuestionCount: 1,
  })
  expect(await preview(`?documentId=${fixture.documentId}`)).toMatchObject({
    questionSelection: 'uncovered',
    availableQuestionCount: 1,
  })

  const session = await start(fixture.documentId)

  expect((await question(session.id, 1)).questionRevisionId).toBe(substantive.revisionId)
})
