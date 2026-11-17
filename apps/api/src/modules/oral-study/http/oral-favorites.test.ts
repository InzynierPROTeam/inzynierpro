import {
  OralMaterialsResponse,
  OralStudySession,
  OralSessionQuestion,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { cosmeticChange } from '~api/modules/learning-content/domain/learning-content.model.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import {
  addFixtureOralCategory,
  addFixtureOralQuestion,
  assignFixtureOralQuestion,
  publishFixtureOralRevision,
  withdrawFixtureOralRevision,
} from '~api/test/oral-learning-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

test('empty oral favourites explain the empty scope and create no session', async () => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )
  const base = `/paths/${fixture.pathId}/oral`
  const preview = await learningRequest(api, visitor, `${base}/favorites-preview`)
  expect(preview.status).toBe(200)
  expect(await preview.json()).toMatchObject({ favoriteQuestionCount: 0, settings: null })
  expect(
    (await learningRequest(api, visitor, `${base}/favorites-sessions`, { questionCount: 1 }))
      .status,
  ).toBe(409)
  const session = await learningRequest(api, visitor, `${base}/favorites-session`)
  expect(session.status).toBe(200)
  expect(await session.json()).toBeNull()
})

test('oral favourite marks are private, idempotent and fixed when a session starts; assessments feed reviews without coverage', async () => {
  const visitor = await loginForPreparation(api)
  const stranger = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)

  for (const account of [visitor, stranger]) {
    await learningRequest(
      api,
      account,
      '/onboarding',
      Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
    )
  }

  const base = `/paths/${fixture.pathId}/oral`
  const categoryId = await addFixtureOralCategory()
  await addFixtureOralQuestion(fixture.pathId, categoryId, 1)

  const regular = Schema.decodeUnknownSync(OralStudySession)(
    await (
      await learningRequest(api, visitor, `${base}/sessions`, { categoryId, questionCount: 1 })
    ).json(),
  )

  const shown = Schema.decodeUnknownSync(OralSessionQuestion)(
    await (
      await learningRequest(api, visitor, `${base}/sessions/${regular.id}/questions/1`)
    ).json(),
  )

  const mark = (method: string) =>
    visitor.jar.fetch(new URL(`/api/v1/study${base}/favorites/${shown.questionId}`, api.baseUrl), {
      method,
    })

  for (let i = 0; i < 2; i++) {
    expect((await mark('PUT')).status).toBe(200)
  }

  const request = <Body>(suffix: string, body?: Body) =>
    learningRequest(api, visitor, `${base}${suffix}`, body)

  expect(await (await request('/favorites-preview')).json()).toMatchObject({
    favoriteQuestionCount: 1,
    settings: { defaultQuestionCount: 1 },
  })
  expect(
    await (await learningRequest(api, stranger, `${base}/favorites-preview`)).json(),
  ).toMatchObject({ favoriteQuestionCount: 0 })

  const session = Schema.decodeUnknownSync(OralStudySession)(
    await (await request('/favorites-sessions', { questionCount: 1 })).json(),
  )

  expect(session).toMatchObject({ kind: 'favourites', category: null })
  expect((await request('/favorites-sessions', { questionCount: 1 })).status).toBe(409)
  expect(await (await request('/favorites-session')).json()).toMatchObject({ id: session.id })
  expect((await mark('DELETE')).status).toBe(200)

  const before = Schema.decodeUnknownSync(Schema.toCodecJson(OralMaterialsResponse))(
    await (await request('?limit=100')).json(),
  ).data.find(category => category.id === categoryId)

  expect(before).toMatchObject({ id: categoryId, completedQuestionCount: 0 })

  const selected = Schema.decodeUnknownSync(OralSessionQuestion)(
    await (await request(`/sessions/${session.id}/questions/1`)).json(),
  )

  expect(selected).toMatchObject({ questionId: shown.questionId, isFavorite: false })
  expect(
    (
      await request(`/sessions/${session.id}/questions/1/self-assessment`, {
        oralRevisionId: selected.oralRevisionId,
        selfAssessment: 'easy',
      })
    ).status,
  ).toBe(200)

  const after = Schema.decodeUnknownSync(Schema.toCodecJson(OralMaterialsResponse))(
    await (await request('?limit=100')).json(),
  ).data.find(category => category.id === categoryId)

  expect(after).toEqual(before)
  expect(await (await request('/review-preview')).json()).toMatchObject({
    dueQuestionCount: 0,
    nextDueAt: expect.any(String),
  })
})

test('oral notes stay private across paths, validate text, and distinguish cosmetic from substantive revisions even in pinned sessions', async () => {
  const visitor = await loginForPreparation(api)
  const stranger = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  const other = await createStudyFixture('60000000-0000-4000-8000-000000000006')
  const categoryId = await addFixtureOralCategory()
  const question = await addFixtureOralQuestion(fixture.pathId, categoryId, 1)
  await assignFixtureOralQuestion(other.pathId, question.id)

  for (const account of [visitor, stranger]) {
    for (const path of [fixture, other]) {
      await learningRequest(
        api,
        account,
        '/onboarding',
        Schema.encodeSync(CompleteOnboardingPayload)(path.config),
      )
    }
  }

  const base = `/paths/${fixture.pathId}/oral`

  const start = async (account: typeof visitor, pathId: typeof fixture.pathId) => {
    const response = await learningRequest(api, account, `/paths/${pathId}/oral/sessions`, {
      categoryId,
      questionCount: 1,
    })

    expect(response.status).toBe(200)

    return Schema.decodeUnknownSync(OralStudySession)(await response.json()).id
  }

  const sessionId = await start(visitor, fixture.pathId)
  const otherSession = await start(visitor, other.pathId)
  const strangerSession = await start(stranger, fixture.pathId)

  const shown = async (account: typeof visitor, pathId: typeof fixture.pathId, id: string) =>
    (await learningRequest(api, account, `/paths/${pathId}/oral/sessions/${id}/questions/1`)).json()

  const note = (method: string, text?: string) => {
    const init: RequestInit = { method }

    if (text !== undefined) {
      init.headers = { 'content-type': 'application/json' }
      init.body = JSON.stringify({ text })
    }

    return visitor.jar.fetch(
      new URL(`/api/v1/study${base}/notes/${question.id}`, api.baseUrl),
      init,
    )
  }

  for (const text of ['', '   ', 'x'.repeat(2001)]) {
    expect((await note('PUT', text)).status).toBe(400)
  }

  expect((await note('PUT', 'My private oral note')).status).toBe(200)
  expect(await shown(visitor, other.pathId, otherSession)).toMatchObject({
    note: { text: 'My private oral note', refersToEarlierWording: false },
  })
  expect(await shown(stranger, fixture.pathId, strangerSession)).toMatchObject({ note: null })
  await publishFixtureOralRevision(question.id, cosmeticChange)
  expect(await shown(visitor, fixture.pathId, sessionId)).toMatchObject({
    note: { refersToEarlierWording: false },
  })
  await publishFixtureOralRevision(question.id)
  expect(await shown(visitor, fixture.pathId, sessionId)).toMatchObject({
    note: { text: 'My private oral note', refersToEarlierWording: true },
  })
  expect((await note('PUT', 'Updated note')).status).toBe(200)
  expect(await shown(visitor, fixture.pathId, sessionId)).toMatchObject({
    note: { refersToEarlierWording: false },
  })
  expect((await note('DELETE')).status).toBe(200)
  expect(await shown(visitor, other.pathId, otherSession)).toMatchObject({ note: null })
})

test('oral favourites default to ten, select catalogue order, share marks across paths and exclude withdrawn or unrelated questions', async () => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  const other = await createStudyFixture('60000000-0000-4000-8000-000000000006')

  for (const path of [fixture, other]) {
    await learningRequest(
      api,
      visitor,
      '/onboarding',
      Schema.encodeSync(CompleteOnboardingPayload)(path.config),
    )
  }

  const categoryId = await addFixtureOralCategory()
  const questions = []

  for (let position = 1; position <= 12; position++) {
    questions.push(await addFixtureOralQuestion(fixture.pathId, categoryId, position))
  }

  const withdrawn = await addFixtureOralQuestion(fixture.pathId, categoryId, 13)
  await assignFixtureOralQuestion(other.pathId, questions[0]!.id)

  const mark = (questionId: string, pathId = fixture.pathId) =>
    visitor.jar.fetch(
      new URL(`/api/v1/study/paths/${pathId}/oral/favorites/${questionId}`, api.baseUrl),
      { method: 'PUT' },
    )

  for (const question of [...questions].reverse().concat(withdrawn)) {
    expect((await mark(question.id)).status).toBe(200)
  }

  await withdrawFixtureOralRevision(withdrawn.revisionId)
  const base = `/paths/${fixture.pathId}/oral`

  const request = <Body>(suffix: string, body?: Body) =>
    learningRequest(api, visitor, `${base}${suffix}`, body)

  expect(await (await request('/favorites-preview')).json()).toMatchObject({
    favoriteQuestionCount: 12,
    settings: {
      defaultQuestionCount: 10,
      minimumQuestionCount: 1,
      maximumQuestionCount: 12,
      canChangeQuestionCount: true,
    },
  })
  expect((await request('/favorites-sessions', { questionCount: 13 })).status).toBe(409)

  const session = Schema.decodeUnknownSync(OralStudySession)(
    await (await request('/favorites-sessions', { questionCount: 10 })).json(),
  )

  const selected = []

  for (let position = 1; position <= 10; position++) {
    selected.push(
      Schema.decodeUnknownSync(OralSessionQuestion)(
        await (await request(`/sessions/${session.id}/questions/${position}`)).json(),
      ).questionId,
    )
  }

  expect(selected).toEqual(questions.slice(0, 10).map(question => question.id))
  expect(
    await (
      await learningRequest(api, visitor, `/paths/${other.pathId}/oral/favorites-preview`)
    ).json(),
  ).toMatchObject({ favoriteQuestionCount: 1 })
  expect((await mark(questions[1]!.id, other.pathId)).status).toBe(404)
  await request(`/sessions/${session.id}/end`, {})
  expect(await (await request(`/sessions/${session.id}/next-step`)).json()).toMatchObject({
    type: 'start-study',
  })
})
