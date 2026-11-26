import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  DocumentResponse,
  FavoriteQuestion,
  FavoritesPreview,
  SessionNextStepResponse,
  SessionQuestion,
  StudySession,
  StudySessionResponse,
  StudySessionSummary,
} from '@inzpro/api-contracts/modules/written-study/responses'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Option, Schema } from 'effect'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { startTestApi, type TestApi, type TestVisitor } from '~api/test/api-server.js'
import { catalogueTestTime } from '~api/test/clock.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'
import {
  addFixtureQuestion,
  attachFixtureQuestion,
  currentReviewState,
  withdrawFixtureRevision,
} from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const decode =
  <T, E>(schema: Schema.Codec<T, E>) =>
  async (response: Response) =>
    Schema.decodeUnknownSync(schema)(await response.json())

const otherPathSpecialization = '60000000-0000-4000-8000-000000000006'

const favoriteRequest = (
  visitor: TestVisitor,
  pathId: QualificationPathId,
  questionId: string,
  method: 'PUT' | 'DELETE',
) =>
  visitor.jar.fetch(new URL(`/api/v1/study/paths/${pathId}/favorites/${questionId}`, api.baseUrl), {
    method,
  })

const learnerFor = async (pathId: QualificationPathId, config: CompleteOnboardingPayload) => {
  const visitor = await loginForPreparation(api)

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${pathId}${path}`, body)

  const mark = (questionId: string) => favoriteRequest(visitor, pathId, questionId, 'PUT')

  const unmark = (questionId: string) => favoriteRequest(visitor, pathId, questionId, 'DELETE')

  const scope = (documentId?: string) =>
    documentId === undefined ? '' : `?documentId=${documentId}`

  const preview = async (documentId?: string) =>
    decode(Schema.NullOr(FavoritesPreview))(await request(`/favorites-preview${scope(documentId)}`))

  const unfinished = async (documentId?: string) =>
    decode(StudySessionResponse)(await request(`/favorites-session${scope(documentId)}`))

  const start = (questionCount: number, documentId?: string) =>
    request('/favorites-sessions', { questionCount, documentId })

  const question = async (sessionId: string, position: number) =>
    decode(SessionQuestion)(await request(`/sessions/${sessionId}/questions/${position}`))

  const sessionQuestionIds = async (session: StudySession) => {
    const ids: Array<string> = []

    for (let position = 1; position <= session.progress.total; position++) {
      ids.push((await question(session.id, position)).questionId)
    }

    return ids
  }

  const answer = async (sessionId: string, position: number) => {
    const shown = await question(sessionId, position)

    return request(`/sessions/${sessionId}/questions/${position}/answer`, {
      questionRevisionId: shown.questionRevisionId,
      answerId: shown.answers.find(option => option.isCorrect)!.id,
    })
  }

  const end = (sessionId: string) => request(`/sessions/${sessionId}/end`, {})

  return {
    visitor,
    request,
    mark,
    unmark,
    preview,
    unfinished,
    start,
    question,
    sessionQuestionIds,
    answer,
    end,
  }
}

const learnerWithQuestions = async (questionCount: number) => {
  const fixture = await createStudyFixture(studySessionSpecialization)
  const questions: Array<Awaited<ReturnType<typeof addFixtureQuestion>>> = []

  for (let index = 0; index < questionCount; index++) {
    questions.push(await addFixtureQuestion(fixture.pathId, fixture.documentId))
  }

  const learner = await learnerFor(fixture.pathId, fixture.config)

  return { ...learner, fixture, questions }
}

describe('marking favourites', () => {
  test('marking and unmarking are idempotent and show on the question', async () => {
    const learner = await learnerWithQuestions(1)
    const [question] = learner.questions

    for (let attempt = 0; attempt < 2; attempt++) {
      const marked = await learner.mark(question!.id)

      expect(marked.status).toBe(200)
      expect(await decode(FavoriteQuestion)(marked)).toEqual({
        questionId: question!.id,
        isFavorite: true,
      })
    }

    expect(await learner.preview()).toMatchObject({ favoriteQuestionCount: 1 })

    const session = await decode(StudySession)(await learner.start(1))

    expect(await learner.question(session.id, 1)).toMatchObject({ isFavorite: true })

    for (let attempt = 0; attempt < 2; attempt++) {
      expect(await decode(FavoriteQuestion)(await learner.unmark(question!.id))).toEqual({
        questionId: question!.id,
        isFavorite: false,
      })
    }

    expect(await learner.question(session.id, 1)).toMatchObject({ isFavorite: false })
    expect(await learner.preview()).toMatchObject({ favoriteQuestionCount: 0, settings: null })
  })

  test('a mark is shared with every path the question is on', async () => {
    const learner = await learnerWithQuestions(1)
    const [question] = learner.questions
    const other = await createStudyFixture(otherPathSpecialization)

    await attachFixtureQuestion(other.pathId, learner.fixture.documentId, question!.id)
    await learningRequest(
      api,
      learner.visitor,
      '/onboarding',
      Schema.encodeSync(CompleteOnboardingPayload)(other.config),
    )

    expect((await learner.mark(question!.id)).status).toBe(200)

    const otherPreview = await decode(FavoritesPreview)(
      await learningRequest(api, learner.visitor, `/paths/${other.pathId}/favorites-preview`),
    )

    expect(otherPreview).toMatchObject({
      qualificationPathId: other.pathId,
      favoriteQuestionCount: 1,
    })

    expect(
      (await favoriteRequest(learner.visitor, other.pathId, question!.id, 'DELETE')).status,
    ).toBe(200)
    expect(await learner.preview()).toMatchObject({ favoriteQuestionCount: 0 })
  })

  test('a question that is not on the path cannot be marked from it, but an own mark can always be removed', async () => {
    const learner = await learnerWithQuestions(0)
    const elsewhere = await createStudyFixture(otherPathSpecialization)
    const foreign = await addFixtureQuestion(elsewhere.pathId, elsewhere.documentId)

    for (const questionId of [foreign.id, crypto.randomUUID()]) {
      const refused = await learner.mark(questionId)

      expect(refused.status).toBe(404)
      expect(await refused.json()).toMatchObject({ type: 'question_not_found' })
      expect(await decode(FavoriteQuestion)(await learner.unmark(questionId))).toEqual({
        questionId,
        isFavorite: false,
      })
    }

    expect(await learner.preview()).toMatchObject({ favoriteQuestionCount: 0 })
  })

  test('the browser may send marks and unmarks from the platform', async () => {
    const owner = await learnerWithQuestions(1)

    for (const method of ['PUT', 'DELETE']) {
      const preflight = await fetch(
        new URL(
          `/api/v1/study/paths/${owner.fixture.pathId}/favorites/${owner.questions[0]!.id}`,
          api.baseUrl,
        ),
        {
          method: 'OPTIONS',
          headers: {
            origin: 'http://localhost:8001',
            'access-control-request-method': method,
          },
        },
      )

      expect(preflight.headers.get('access-control-allow-methods')).toContain(method)
    }
  })

  test('another account cannot mark on a path it is not assigned to', async () => {
    const owner = await learnerWithQuestions(1)
    const stranger = await loginForPreparation(api)

    const refused = await favoriteRequest(
      stranger,
      owner.fixture.pathId,
      owner.questions[0]!.id,
      'PUT',
    )

    expect(refused.status).toBe(403)
    expect(await owner.preview()).toMatchObject({ favoriteQuestionCount: 0 })
  })
})

describe('the favourites preview', () => {
  test('with nothing marked no favourites session is created', async () => {
    const learner = await learnerWithQuestions(1)

    expect(await learner.preview()).toEqual({
      qualificationPathId: learner.fixture.pathId,
      document: null,
      favoriteQuestionCount: 0,
      settings: null,
    })

    const refused = await learner.start(1)

    expect(refused.status).toBe(409)
    expect(await refused.json()).toMatchObject({ type: 'stale_session_preview' })
    expect(await learner.unfinished()).toBeNull()
  })

  test('a withdrawn favourite is not offered', async () => {
    const learner = await learnerWithQuestions(2)
    const [kept, withdrawn] = learner.questions

    await learner.mark(kept!.id)
    await learner.mark(withdrawn!.id)
    await withdrawFixtureRevision(withdrawn!.revisionId)

    expect(await learner.preview()).toMatchObject({
      favoriteQuestionCount: 1,
      settings: {
        defaultQuestionCount: 1,
        canChangeQuestionCount: false,
        minimumQuestionCount: 1,
        maximumQuestionCount: 1,
      },
    })
  })

  test('up to 25 favourites the session holds all of them', async () => {
    const learner = await learnerWithQuestions(3)

    for (const question of learner.questions) {
      await learner.mark(question.id)
    }

    expect(await learner.preview()).toMatchObject({
      settings: { defaultQuestionCount: 3, canChangeQuestionCount: false },
    })
    expect((await learner.start(2)).status).toBe(409)
  })
})

describe('favourites sessions', () => {
  test('the set is fixed at start, most recently marked first, and unmarking changes nothing', async () => {
    const learner = await learnerWithQuestions(3)

    for (const question of [...learner.questions].reverse()) {
      await learner.mark(question.id)
    }

    const response = await learner.start(3)

    expect(response.status).toBe(200)

    const session = await decode(StudySession)(response)

    expect(session).toMatchObject({ kind: 'favourites', status: 'active', progress: { total: 3 } })

    await learner.unmark(learner.questions[1]!.id)

    expect(await learner.sessionQuestionIds(session)).toEqual(
      learner.questions.map(question => question.id),
    )
    expect(await learner.unfinished()).toMatchObject({ id: session.id, progress: { total: 3 } })
  })

  test('the path has at most one unfinished favourites session, apart from regular study', async () => {
    const learner = await learnerWithQuestions(1)

    await learner.mark(learner.questions[0]!.id)

    const session = await decode(StudySession)(await learner.start(1))
    const refused = await learner.start(1)

    expect(refused.status).toBe(409)
    expect(await refused.json()).toMatchObject({
      type: 'study_session_already_started',
      sessionId: session.id,
      currentPosition: 1,
    })

    expect(await (await learner.request('/latest-session')).json()).toBeNull()

    await learner.end(session.id)

    expect(await learner.unfinished()).toBeNull()
    expect((await learner.start(1)).status).toBe(200)
  })

  test('a favourites answer updates SRS but never covers the question in the round', async () => {
    const learner = await learnerWithQuestions(1)
    const [question] = learner.questions

    await learner.mark(question!.id)

    const session = await decode(StudySession)(await learner.start(1))

    expect(
      await currentReviewState(learner.visitor.userId, learner.fixture.pathId, question!.id),
    ).toEqual(Option.none())
    expect((await learner.answer(session.id, 1)).status).toBe(200)

    const state = Option.getOrThrow(
      await currentReviewState(learner.visitor.userId, learner.fixture.pathId, question!.id),
    )

    expect(state.reps).toBe(1)
    expect(DateTime.isGreaterThan(state.dueAt, catalogueTestTime)).toBe(true)
    expect(
      (
        await decode(DocumentResponse)(
          await learner.request(`/documents/${learner.fixture.documentId}`),
        )
      ).document,
    ).toMatchObject({ completedQuestionCount: 0 })
  })
})

describe('the favourites summary', () => {
  test('an ended favourites session has a summary and leads back to study', async () => {
    const learner = await learnerWithQuestions(2)
    const [first, second] = learner.questions

    await learner.mark(first!.id)
    await learner.mark(second!.id)

    const session = await decode(StudySession)(await learner.start(2))

    expect((await learner.answer(session.id, 1)).status).toBe(200)
    await learner.unmark(second!.id)
    await learner.end(session.id)

    expect(
      await decode(StudySessionSummary)(await learner.request(`/sessions/${session.id}/summary`)),
    ).toMatchObject({
      kind: 'favourites',
      status: 'ended',
      document: null,
      result: { correct: 1, incorrect: 0, correctPercent: 50 },
    })

    expect(
      await decode(SessionNextStepResponse)(
        await learner.request(`/sessions/${session.id}/next-step`),
      ),
    ).toMatchObject({ type: 'start-study' })
  })
})

describe('favourites of one category', () => {
  test('a category scope counts and draws only that category’s favourites', async () => {
    const learner = await learnerWithQuestions(1)
    const other = await createStudyFixture(studySessionSpecialization)

    const otherQuestions = [
      await addFixtureQuestion(other.pathId, other.documentId),
      await addFixtureQuestion(other.pathId, other.documentId),
    ]

    for (const question of [...learner.questions, ...otherQuestions]) {
      await learner.mark(question.id)
    }

    expect(await learner.preview()).toMatchObject({ document: null, favoriteQuestionCount: 3 })
    expect(await learner.preview(other.documentId)).toMatchObject({
      document: { id: other.documentId, title: 'Test-only threshold document' },
      favoriteQuestionCount: 2,
      settings: { defaultQuestionCount: 2 },
    })

    const session = await decode(StudySession)(await learner.start(2, other.documentId))

    expect(session).toMatchObject({ kind: 'favourites', progress: { total: 2 } })
    expect(await learner.sessionQuestionIds(session)).toEqual(
      otherQuestions.toReversed().map(({ id }) => id),
    )
    await learner.end(session.id)

    expect(
      await decode(StudySessionSummary)(await learner.request(`/sessions/${session.id}/summary`)),
    ).toMatchObject({ document: { id: other.documentId } })
  })

  test('each scope has at most one unfinished favourites session', async () => {
    const learner = await learnerWithQuestions(1)

    await learner.mark(learner.questions[0]!.id)

    const inCategory = await decode(StudySession)(
      await learner.start(1, learner.fixture.documentId),
    )

    const refused = await learner.start(1, learner.fixture.documentId)

    expect(refused.status).toBe(409)
    expect(await refused.json()).toMatchObject({
      type: 'study_session_already_started',
      sessionId: inCategory.id,
    })
    expect(await learner.unfinished(learner.fixture.documentId)).toMatchObject({
      id: inCategory.id,
    })

    expect(await learner.unfinished()).toBeNull()

    const wholePath = await decode(StudySession)(await learner.start(1))

    expect(await learner.unfinished()).toMatchObject({ id: wholePath.id })
  })

  test('a category that is not on the path has no favourites preview and starts nothing', async () => {
    const learner = await learnerWithQuestions(1)
    const elsewhere = await createStudyFixture(otherPathSpecialization)

    await learner.mark(learner.questions[0]!.id)

    expect(await learner.preview(elsewhere.documentId)).toBeNull()

    const refused = await learner.start(1, elsewhere.documentId)

    expect(refused.status).toBe(404)
    expect(await refused.json()).toMatchObject({ type: 'document_not_found' })
  })
})
