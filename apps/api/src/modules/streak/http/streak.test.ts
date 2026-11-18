import {
  OralQuizChecksResponse,
  OralSessionQuestion,
  OralStudySession,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { Streak } from '@inzpro/api-contracts/modules/streak/responses'
import {
  SessionPreview,
  SessionQuestion,
  StudySession,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { DateTime, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi, type TestVisitor } from '~api/test/api-server.js'
import { catalogueTestTime } from '~api/test/clock.js'
import {
  createMockExamFixture,
  mockExamPathConfiguration,
  resolveFixturePath,
} from '~api/test/mock-exam-fixtures.js'
import { mockExamLearner } from '~api/test/mock-exam-learner.js'
import {
  addFixtureKnowledgeCheck,
  addFixtureOralCategory,
  addFixtureOralQuestion,
} from '~api/test/oral-learning-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'
import { addFixtureQuestion } from '~api/test/written-learning-fixtures.js'

let api: TestApi
let lastMinuteOfDay: TestApi
let firstMinuteOfNextDay: TestApi
let afterMissedDay: TestApi
let tenDaysLater: TestApi

beforeAll(async () => {
  ;[api, lastMinuteOfDay, firstMinuteOfNextDay, afterMissedDay, tenDaysLater] = await Promise.all([
    startTestApi(),
    startTestApi({ now: DateTime.makeUnsafe('2026-11-13T22:59:30.000Z') }),
    startTestApi({ now: DateTime.makeUnsafe('2026-11-13T23:00:30.000Z') }),
    startTestApi({ now: DateTime.makeUnsafe('2026-11-16T12:00:00.000Z') }),
    startTestApi({ now: DateTime.add(catalogueTestTime, { days: 10 }) }),
  ])
})

afterAll(() =>
  Promise.all(
    [api, lastMinuteOfDay, firstMinuteOfNextDay, afterMissedDay, tenDaysLater].map(started =>
      started.close(),
    ),
  ),
)

const decode =
  <T, E>(schema: Schema.Codec<T, E>) =>
  async (response: Response) => {
    expect(response.status, await response.clone().text()).toBe(200)

    return Schema.decodeUnknownSync(schema)(await response.json())
  }

const streakOf = async (visitor: TestVisitor, on = api) =>
  decode(Streak)(await visitor.jar.fetch(new URL('/api/v1/streak', on.baseUrl)))

const writtenLearner = async (
  questionCount: number,
  {
    specializationId = studySessionSpecialization,
    signedIn,
  }: { readonly specializationId?: string; readonly signedIn?: TestVisitor } = {},
) => {
  const fixture = await createStudyFixture(specializationId)

  for (let index = 0; index < questionCount; index++) {
    await addFixtureQuestion(fixture.pathId, fixture.documentId)
  }

  const visitor = signedIn ?? (await loginForPreparation(api))

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body, on = api) =>
    learningRequest(on, visitor, `/paths/${fixture.pathId}${path}`, body)

  const startStudy = async (on = api) => {
    const offered = await decode(SessionPreview)(
      await request(`/preview?documentId=${fixture.documentId}`, undefined, on),
    )

    return decode(StudySession)(
      await request(
        '/sessions',
        {
          documentId: fixture.documentId,
          questionCount: offered.settings.defaultQuestionCount,
          questionSelection: offered.questionSelection,
        },
        on,
      ),
    )
  }

  const answer = async (sessionId: string, position: number, on = api) => {
    const shown = await decode(SessionQuestion)(
      await request(`/sessions/${sessionId}/questions/${position}`, undefined, on),
    )

    return decode(Schema.Unknown)(
      await request(
        `/sessions/${sessionId}/questions/${position}/answer`,
        {
          questionRevisionId: shown.questionRevisionId,
          answerId: shown.answers.find(option => !option.isCorrect)!.id,
        },
        on,
      ),
    )
  }

  const end = (sessionId: string, on = api) => request(`/sessions/${sessionId}/end`, {}, on)

  const answerAll = async (session: StudySession, count: number, on = api) => {
    for (let position = 1; position <= count; position++) {
      await answer(session.id, position, on)
    }

    await end(session.id, on)
  }

  const answerFirst = async (count: number, on = api) => {
    const session = await startStudy(on)

    await answerAll(session, count, on)

    return session
  }

  const startOther = (path: string, questionCount: number, on: TestApi) =>
    request(path, { questionCount }, on).then(decode(StudySession))

  const markFavorite = async (sessionId: string, position: number) => {
    const shown = await decode(SessionQuestion)(
      await request(`/sessions/${sessionId}/questions/${position}`),
    )

    const marked = await visitor.jar.fetch(
      new URL(`/api/v1/study/paths/${fixture.pathId}/favorites/${shown.questionId}`, api.baseUrl),
      { method: 'PUT' },
    )

    expect(marked.status).toBe(200)
  }

  return {
    visitor,
    request,
    startStudy,
    answer,
    end,
    answerAll,
    answerFirst,
    startOther,
    markFavorite,
  }
}

const oralLearner = async (questionCount: number) => {
  const fixture = await createStudyFixture(studySessionSpecialization)
  const categoryId = await addFixtureOralCategory()

  for (let position = 1; position <= questionCount; position++) {
    const question = await addFixtureOralQuestion(fixture.pathId, categoryId, position)

    await addFixtureKnowledgeCheck(question.id, question.revisionId, 'true_false', [
      { text: 'Prawda', isCorrect: true },
      { text: 'Fałsz', isCorrect: false },
    ])
  }

  const visitor = await loginForPreparation(api)

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${fixture.pathId}/oral${path}`, body)

  const finishedSession = async () => {
    const session = await decode(OralStudySession)(
      await request('/sessions', { categoryId, questionCount }),
    )

    for (let position = 1; position <= questionCount; position++) {
      const shown = await decode(OralSessionQuestion)(
        await request(`/sessions/${session.id}/questions/${position}`),
      )

      await decode(Schema.Unknown)(
        await request(`/sessions/${session.id}/questions/${position}/self-assessment`, {
          oralRevisionId: shown.oralRevisionId,
          selfAssessment: 'hard',
        }),
      )
    }

    await request(`/sessions/${session.id}/end`, {})

    return session
  }

  const quizChecks = async (sessionId: string) => {
    await decode(Schema.Unknown)(
      await request(`/sessions/${sessionId}/quiz`, { formats: ['true_false'] }),
    )

    return Schema.decodeUnknownSync(Schema.toCodecJson(OralQuizChecksResponse))(
      await (await request(`/sessions/${sessionId}/quiz/checks`)).json(),
    ).data
  }

  const answerCheck = async (sessionId: string, position: number, optionId: string) =>
    decode(Schema.Unknown)(
      await request(`/sessions/${sessionId}/quiz/checks/${position}/answer`, {
        optionIds: [optionId],
      }),
    )

  return { visitor, finishedSession, quizChecks, answerCheck }
}

test('an account without answers has no streak', async () => {
  const visitor = await loginForPreparation(api)

  expect(await streakOf(visitor)).toEqual({
    currentStreak: 0,
    longestStreak: 0,
    todayAnswerCount: 0,
    dailyAnswerThreshold: 5,
    todayQualifies: false,
  })
})

test('five written answers qualify the day regardless of correctness, and a retried answer counts once', async () => {
  const learner = await writtenLearner(6)
  const session = await learner.startStudy()

  for (let position = 1; position <= 4; position++) {
    await learner.answer(session.id, position)
  }

  await learner.answer(session.id, 4)

  expect(await streakOf(learner.visitor)).toMatchObject({
    currentStreak: 0,
    todayAnswerCount: 4,
    todayQualifies: false,
  })

  await learner.answer(session.id, 5)

  expect(await streakOf(learner.visitor)).toMatchObject({
    currentStreak: 1,
    longestStreak: 1,
    todayAnswerCount: 5,
    todayQualifies: true,
  })
})

test('written answers in reviews and favourites count towards the day', async () => {
  const learner = await writtenLearner(5)
  const study = await learner.startStudy()

  await learner.markFavorite(study.id, 4)
  await learner.markFavorite(study.id, 5)
  await learner.answerAll(study, 3)

  expect(await streakOf(learner.visitor)).toMatchObject({ todayAnswerCount: 3 })

  await learner.answerAll(
    await learner.startOther('/review-sessions', 3, tenDaysLater),
    3,
    tenDaysLater,
  )
  await learner.answerAll(
    await learner.startOther('/favorites-sessions', 2, tenDaysLater),
    2,
    tenDaysLater,
  )

  expect(await streakOf(learner.visitor, tenDaysLater)).toMatchObject({
    currentStreak: 1,
    longestStreak: 1,
    todayAnswerCount: 5,
    todayQualifies: true,
  })
})

test('days follow Europe/Warsaw midnight and a missed day breaks the streak while the longest is kept', async () => {
  const learner = await writtenLearner(15)

  await learner.answerFirst(5, lastMinuteOfDay)

  expect(await streakOf(learner.visitor, firstMinuteOfNextDay)).toMatchObject({
    currentStreak: 1,
    todayAnswerCount: 0,
    todayQualifies: false,
  })

  await learner.answerFirst(5, firstMinuteOfNextDay)

  expect(await streakOf(learner.visitor, firstMinuteOfNextDay)).toMatchObject({
    currentStreak: 2,
    longestStreak: 2,
    todayQualifies: true,
  })

  expect(await streakOf(learner.visitor, afterMissedDay)).toMatchObject({
    currentStreak: 0,
    longestStreak: 2,
    todayQualifies: false,
  })

  await learner.answerFirst(5, afterMissedDay)

  expect(await streakOf(learner.visitor, afterMissedDay)).toMatchObject({
    currentStreak: 1,
    longestStreak: 2,
    todayQualifies: true,
  })
})

test('oral self-assessments and mini-quiz checks count towards the day, and a repeated check counts once', async () => {
  const learner = await oralLearner(3)
  const session = await learner.finishedSession()

  expect(await streakOf(learner.visitor)).toMatchObject({ todayAnswerCount: 3 })

  const [first, second] = await learner.quizChecks(session.id)

  await learner.answerCheck(session.id, first!.position, first!.options[1]!.id)
  await learner.answerCheck(session.id, first!.position, first!.options[1]!.id)
  await learner.answerCheck(session.id, second!.position, second!.options[0]!.id)

  expect(await streakOf(learner.visitor)).toMatchObject({
    currentStreak: 1,
    todayAnswerCount: 5,
    todayQualifies: true,
  })
})

test('draft mock exam answers never count, and the final answers count once the exam is finished', async () => {
  const configuration = mockExamPathConfiguration('60000000-0000-4000-8000-000000000011')

  await createMockExamFixture(
    await resolveFixturePath(configuration),
    [{ questionCount: 6, eligibleQuestions: 6 }],
    3,
  )

  const learner = await mockExamLearner(api, configuration)
  const attempt = await learner.started()
  const questions = await learner.questions(attempt)

  for (const question of questions.slice(0, 5)) {
    const saved = await learner.saveAnswer(attempt.id, question.position, {
      answerId: question.answers[0]!.id,
      expectedVersion: question.version,
    })

    expect(saved.status).toBe(200)
  }

  const changed = questions[0]!

  await learner.saveAnswer(attempt.id, changed.position, {
    answerId: changed.answers[1]!.id,
    expectedVersion: (await learner.question(attempt.id, changed.position))!.version,
  })

  expect(await streakOf(learner.visitor)).toMatchObject({
    todayAnswerCount: 0,
    todayQualifies: false,
  })

  expect((await learner.request(`/attempts/${attempt.id}/finish`, 'POST')).status).toBe(200)
  expect((await learner.request(`/attempts/${attempt.id}/finish`, 'POST')).status).toBe(200)

  expect(await streakOf(learner.visitor)).toMatchObject({
    currentStreak: 1,
    todayAnswerCount: 5,
    todayQualifies: true,
  })
})

test('answers on different paths add up to one account streak', async () => {
  const firstPath = await writtenLearner(3)

  await firstPath.answerFirst(3)

  const secondPath = await writtenLearner(2, {
    specializationId: '60000000-0000-4000-8000-000000000006',
    signedIn: firstPath.visitor,
  })

  await secondPath.answerFirst(2)

  expect(await streakOf(firstPath.visitor)).toMatchObject({
    currentStreak: 1,
    todayAnswerCount: 5,
    todayQualifies: true,
  })
})
