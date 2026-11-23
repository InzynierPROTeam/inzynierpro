import { LearningXpResponse } from '@inzpro/api-contracts/modules/learning-xp/responses'
import { MockExamAttempt } from '@inzpro/api-contracts/modules/mock-exams/responses'
import {
  OralQuizChecksResponse,
  OralStudySession,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import { PathResetResponse } from '@inzpro/api-contracts/modules/path-reset/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { PathResponse } from '@inzpro/api-contracts/modules/preparation/responses'
import {
  DocumentsResponse,
  EndSessionResponse,
  SessionPreview,
  SessionQuestion,
  StudySession,
  SubmitSessionAnswerResponse,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { firstExamBlueprintVersion } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import { pathResetConfirmation } from '@inzpro/domain/modules/path-reset/path-reset'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi, type TestVisitor } from '~api/test/api-server.js'
import {
  createMockExamFixture,
  mockExamPathConfiguration,
  mockExamScoreStatistics,
  mockExamStatistics,
  resolveFixturePath,
} from '~api/test/mock-exam-fixtures.js'
import {
  addFixtureKnowledgeCheck,
  addFixtureOralCategory,
  addFixtureOralQuestion,
  oralKnowledgeCheckStatistics,
  oralSelfAssessmentStatistics,
} from '~api/test/oral-learning-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { loginForPreparation, smallPathConfiguration } from '~api/test/preparation.js'
import {
  addFixtureQuestion,
  writtenAnswerOptionStatistics,
  writtenQuestionStatistics,
} from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const decode =
  <T, E>(schema: Schema.Codec<T, E>) =>
  async (response: Response) => {
    expect(response.status, await response.clone().text()).toBe(200)

    return Schema.decodeUnknownSync(schema)(await response.json())
  }

const call = <Body>(visitor: TestVisitor, method: string, path: string, body?: Body) =>
  visitor.jar.fetch(
    new URL(`/api/v1${path}`, api.baseUrl),
    body === undefined
      ? { method }
      : {
          method,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
  )

const pathLearner = async (configuration: typeof CompleteOnboardingPayload.Encoded) => {
  const visitor = await loginForPreparation(api)
  const pathId = await resolveFixturePath(configuration)

  expect((await call(visitor, 'POST', '/preparation/onboarding', configuration)).status).toBe(200)

  const study = <Body>(path: string, body?: Body) =>
    call(visitor, body === undefined ? 'GET' : 'POST', `/study/paths/${pathId}${path}`, body)

  const mockExam = <Body>(path: string, method = 'GET', body?: Body) =>
    call(visitor, method, `/mock-exams/paths/${pathId}${path}`, body)

  const assignment = async () => {
    const { path } = await decode(PathResponse)(
      await call(visitor, 'GET', `/preparation/paths/${pathId}`),
    )

    return path!
  }

  const reset = async (payload: { readonly expectedVersion?: number } = {}) =>
    call(visitor, 'POST', `/path-reset/paths/${pathId}`, {
      confirmation: pathResetConfirmation,
      expectedVersion: payload.expectedVersion ?? (await assignment()).version,
    })

  const startWrittenSession = async (documentId: string) => {
    const offered = await decode(SessionPreview)(await study(`/preview?documentId=${documentId}`))

    return decode(StudySession)(
      await study('/sessions', {
        documentId,
        questionCount: offered.availableQuestionCount,
        questionSelection: offered.questionSelection,
      }),
    )
  }

  const answerWritten = async (sessionId: string, position: number) => {
    const shown = await decode(SessionQuestion)(
      await study(`/sessions/${sessionId}/questions/${position}`),
    )

    const response = await study(`/sessions/${sessionId}/questions/${position}/answer`, {
      questionRevisionId: shown.questionRevisionId,
      answerId: shown.answers[0]!.id,
    })

    return { response, questionRevisionId: shown.questionRevisionId }
  }

  const learningXp = async () =>
    decode(LearningXpResponse)(await call(visitor, 'GET', '/learning-xp'))

  const streak = async () => (await call(visitor, 'GET', '/streak')).json()

  return {
    visitor,
    pathId,
    study,
    mockExam,
    assignment,
    reset,
    startWrittenSession,
    answerWritten,
    learningXp,
    streak,
  }
}

const examConfiguration = {
  ...mockExamPathConfiguration('60000000-0000-4000-8000-000000000002'),
  examSessionId: smallPathConfiguration.examSessionId,
  accessScope: 'both',
} satisfies typeof CompleteOnboardingPayload.Encoded

test('a reset removes the path learning of both kinds and keeps everything earned', async () => {
  const pathId = await resolveFixturePath(examConfiguration)

  const { blueprintId, documents } = await createMockExamFixture(
    pathId,
    [{ questionCount: 2, eligibleQuestions: 2 }],
    1,
  )

  const [document] = documents
  const categoryId = await addFixtureOralCategory()
  const oralQuestion = await addFixtureOralQuestion(pathId, categoryId, 1)

  const knowledgeCheck = await addFixtureKnowledgeCheck(
    oralQuestion.id,
    oralQuestion.revisionId,
    'true_false',
    [
      { text: 'Prawda', isCorrect: true },
      { text: 'Fałsz', isCorrect: false },
    ],
  )

  const learner = await pathLearner(examConfiguration)

  const writtenSession = await learner.startWrittenSession(document!.documentId)
  const writtenAnswer = await learner.answerWritten(writtenSession.id, 1)
  expect(writtenAnswer.response.status).toBe(200)
  const favoriteQuestion = document!.questions[0]!
  expect(
    (await call(learner.visitor, 'PUT', `/study/paths/${pathId}/favorites/${favoriteQuestion.id}`))
      .status,
  ).toBe(200)

  const oralSession = await decode(OralStudySession)(
    await learner.study('/oral/sessions', { categoryId, questionCount: 1 }),
  )

  expect(
    (
      await learner.study(`/oral/sessions/${oralSession.id}/questions/1/self-assessment`, {
        oralRevisionId: oralQuestion.revisionId,
        selfAssessment: 'easy',
      })
    ).status,
  ).toBe(200)
  expect((await learner.study(`/oral/sessions/${oralSession.id}/end`, {})).status).toBe(200)
  expect(
    (await learner.study(`/oral/sessions/${oralSession.id}/quiz`, { formats: ['true_false'] }))
      .status,
  ).toBe(200)

  const {
    data: [check],
  } = await decode(Schema.toCodecJson(OralQuizChecksResponse))(
    await learner.study(`/oral/sessions/${oralSession.id}/quiz/checks`),
  )

  expect(
    (
      await learner.study(`/oral/sessions/${oralSession.id}/quiz/checks/1/answer`, {
        optionIds: [check!.options[0]!.id],
      })
    ).status,
  ).toBe(200)

  const finished = await decode(MockExamAttempt)(await learner.mockExam('/attempts', 'POST'))
  await decode(Schema.Unknown)(await learner.mockExam(`/attempts/${finished.id}/finish`, 'POST'))
  const unfinished = await decode(MockExamAttempt)(await learner.mockExam('/attempts', 'POST'))

  const dailyPlanBefore = await (await learner.study('/daily-plan')).json()
  const learningXpBefore = await learner.learningXp()
  const streakBefore = await learner.streak()
  const assignmentBefore = await learner.assignment()

  const statistics = async () => ({
    writtenQuestion: await writtenQuestionStatistics(writtenAnswer.questionRevisionId),
    writtenAnswerOption: await writtenAnswerOptionStatistics(writtenAnswer.questionRevisionId),
    oralSelfAssessment: await oralSelfAssessmentStatistics(oralQuestion.revisionId),
    oralKnowledgeCheck: await oralKnowledgeCheckStatistics(knowledgeCheck.revisionId),
    mockExam: await mockExamStatistics(blueprintId, firstExamBlueprintVersion),
    mockExamScore: await mockExamScoreStatistics(blueprintId, firstExamBlueprintVersion),
  })

  const statisticsBefore = await statistics()

  expect(dailyPlanBefore).toMatchObject({ completedQuestionCount: 1 })

  const reset = await decode(PathResetResponse)(await learner.reset())

  expect(reset).toEqual({ qualificationPathId: pathId, version: assignmentBefore.version + 1 })
  expect(await (await learner.study(`/sessions/${writtenSession.id}`)).json()).toBeNull()
  expect(await (await learner.study('/latest-session')).json()).toBeNull()
  expect(await (await learner.study(`/oral/sessions/${oralSession.id}`)).json()).toBeNull()
  expect(await (await learner.study('/oral/latest-session')).json()).toBeNull()
  expect(await (await learner.mockExam(`/attempts/${unfinished.id}`)).json()).toBeNull()
  expect(await (await learner.mockExam(`/attempts/${finished.id}`)).json()).toBeNull()
  expect(await (await learner.mockExam('/history')).json()).toMatchObject({ data: [] })
  expect(await (await learner.study('/review-preview')).json()).toMatchObject({
    dueQuestionCount: 0,
    nextDueAt: null,
  })
  expect(await (await learner.study('/daily-plan')).json()).toMatchObject({
    completedQuestionCount: 0,
  })

  expect(await learner.learningXp()).toEqual(learningXpBefore)
  expect(await learner.streak()).toEqual(streakBefore)
  expect(await learner.assignment()).toEqual({ ...assignmentBefore, version: reset.version })
  expect(await (await learner.study('/favorites-preview')).json()).toMatchObject({
    favoriteQuestionCount: 1,
  })
  expect(Object.values(statisticsBefore).filter(rows => rows.length === 0)).toEqual([])
  expect(await statistics()).toEqual(statisticsBefore)
})

const learnerWithWrittenQuestions = async () => {
  const fixture = await createStudyFixture(studySessionSpecialization)
  await addFixtureQuestion(fixture.pathId, fixture.documentId)
  await addFixtureQuestion(fixture.pathId, fixture.documentId)

  const learner = await pathLearner({
    ...Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
    accessScope: 'written',
  })

  return { ...learner, documentId: fixture.documentId }
}

test('repeating a reset with the version it was based on is refused and keeps later learning', async () => {
  const learner = await learnerWithWrittenQuestions()
  const { version } = await learner.assignment()

  const first = await decode(PathResetResponse)(await learner.reset({ expectedVersion: version }))
  const session = await learner.startWrittenSession(learner.documentId)
  expect((await learner.answerWritten(session.id, 1)).response.status).toBe(200)

  const repeated = await learner.reset({ expectedVersion: version })

  expect(repeated.status).toBe(409)
  expect(await repeated.json()).toMatchObject({ type: 'path_reset_conflict' })
  expect(await learner.assignment()).toMatchObject({ version: first.version })
  expect(await (await learner.study(`/sessions/${session.id}`)).json()).toMatchObject({
    id: session.id,
  })
})

test('a reset without the typed confirmation is rejected', async () => {
  const learner = await learnerWithWrittenQuestions()
  const { version } = await learner.assignment()

  const response = await call(learner.visitor, 'POST', `/path-reset/paths/${learner.pathId}`, {
    confirmation: 'reset',
    expectedVersion: version,
  })

  expect(response.status).toBe(400)
  expect(await learner.assignment()).toMatchObject({ version })
})

test('a reset of a path without an assignment is denied', async () => {
  const visitor = await loginForPreparation(api)
  const pathId = await resolveFixturePath(examConfiguration)

  const response = await call(visitor, 'POST', `/path-reset/paths/${pathId}`, {
    confirmation: pathResetConfirmation,
    expectedVersion: 1,
  })

  expect(response.status).toBe(403)
})

test('an answer racing a reset either lands before it or finds its session gone', async () => {
  const learner = await learnerWithWrittenQuestions()

  for (let attempt = 0; attempt < 5; attempt++) {
    const session = await learner.startWrittenSession(learner.documentId)

    const shown = await decode(SessionQuestion)(
      await learner.study(`/sessions/${session.id}/questions/1`),
    )

    const [answer, reset] = await Promise.all([
      learner.study(`/sessions/${session.id}/questions/1/answer`, {
        questionRevisionId: shown.questionRevisionId,
        answerId: shown.answers[0]!.id,
      }),
      learner.reset(),
    ])

    expect(reset.status).toBe(200)
    expect([200, 404]).toContain(answer.status)
    expect(await (await learner.study(`/sessions/${session.id}`)).json()).toBeNull()
    expect(await (await learner.study('/daily-plan')).json()).toMatchObject({
      completedQuestionCount: 0,
    })
  }
})

test('a round completed again after a reset earns no reward again', async () => {
  const learner = await pathLearner(smallPathConfiguration)

  const studyAllDocuments = async () => {
    const { data: documents } = await decode(Schema.toCodecJson(DocumentsResponse))(
      await learner.study('/documents?limit=100'),
    )

    const rewards = []

    for (const document of documents.filter(
      ({ availableQuestionCount }) => availableQuestionCount > 0,
    )) {
      const session = await learner.startWrittenSession(document.id)

      for (let position = 1; position <= session.progress.total; position++) {
        const { response } = await learner.answerWritten(session.id, position)
        rewards.push((await decode(SubmitSessionAnswerResponse)(response)).rewards)
      }

      rewards.push(
        (await decode(EndSessionResponse)(await learner.study(`/sessions/${session.id}/end`, {})))
          .rewards,
      )
    }

    return rewards.flatMap(({ roundReward }) => (roundReward === null ? [] : [roundReward]))
  }

  expect(await studyAllDocuments()).toEqual([{ part: 'written', xp: 1000 }])

  await decode(PathResetResponse)(await learner.reset())

  expect(await studyAllDocuments()).toEqual([])
})
