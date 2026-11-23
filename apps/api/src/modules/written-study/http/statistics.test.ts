import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  SessionQuestion,
  StudySession,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { DateTime, Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { catalogueTestTime } from '~api/test/clock.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'
import {
  addFixtureQuestion,
  writtenAnswerOptionStatistics,
  writtenQuestionStatistics,
} from '~api/test/written-learning-fixtures.js'

let api: TestApi
let lastMinuteOfDay: TestApi
let firstMinuteOfNextDay: TestApi

beforeAll(async () => {
  ;[api, lastMinuteOfDay, firstMinuteOfNextDay] = await Promise.all([
    startTestApi(),
    startTestApi({ now: DateTime.makeUnsafe('2026-11-13T22:59:30.000Z') }),
    startTestApi({ now: DateTime.makeUnsafe('2026-11-13T23:00:30.000Z') }),
  ])
})

afterAll(() =>
  Promise.all([api, lastMinuteOfDay, firstMinuteOfNextDay].map(started => started.close())),
)

const studyDay = studyDayOf(catalogueTestTime).start

const learnerInSession = async (
  fixture: Awaited<ReturnType<typeof createStudyFixture>>,
  on = api,
) => {
  const visitor = await loginForPreparation(on)

  await learningRequest(
    on,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(on, visitor, `/paths/${fixture.pathId}${path}`, body)

  const session = Schema.decodeUnknownSync(StudySession)(
    await (
      await request('/sessions', {
        documentId: fixture.documentId,
        questionCount: 2,
        questionSelection: 'uncovered',
      })
    ).json(),
  )

  const questions = await Promise.all(
    [1, 2].map(async position =>
      Schema.decodeUnknownSync(SessionQuestion)(
        await (await request(`/sessions/${session.id}/questions/${position}`)).json(),
      ),
    ),
  )

  const answer = async (questionRevisionId: string, optionText: string, assisted = false) => {
    const question = questions.find(shown => shown.questionRevisionId === questionRevisionId)!
    const sessionPath = `/sessions/${session.id}/questions/${question.position}`

    if (assisted) {
      await request(`${sessionPath}/assistance`, { kind: 'explanation' })
    }

    const response = await request(`${sessionPath}/answer`, {
      questionRevisionId,
      answerId: question.answers.find(option => option.text === optionText)!.id,
    })

    expect(response.status).toBe(200)
  }

  return { answer }
}

test('written answers update anonymous statistics per revision, mode, assistance and option', async () => {
  const fixture = await createStudyFixture(studySessionSpecialization)
  const first = await addFixtureQuestion(fixture.pathId, fixture.documentId)
  const second = await addFixtureQuestion(fixture.pathId, fixture.documentId)
  const [correctOption, wrongOption] = first.answers

  const learner = await learnerInSession(fixture)
  await learner.answer(first.revisionId, 'A')
  await learner.answer(second.revisionId, 'B', true)

  const otherLearner = await learnerInSession(fixture)
  await otherLearner.answer(first.revisionId, 'B')

  expect(await writtenQuestionStatistics(first.revisionId)).toEqual([
    { mode: 'study', assistance: 'none', studyDay, answerCount: 2, correctCount: 1 },
  ])
  expect(await writtenQuestionStatistics(second.revisionId)).toEqual([
    { mode: 'study', assistance: 'explanation', studyDay, answerCount: 1, correctCount: 0 },
  ])
  expect(await writtenAnswerOptionStatistics(first.revisionId)).toEqual(
    expect.arrayContaining([
      {
        answerId: correctOption!.id,
        mode: 'study',
        assistance: 'none',
        studyDay,
        selectionCount: 1,
      },
      {
        answerId: wrongOption!.id,
        mode: 'study',
        assistance: 'none',
        studyDay,
        selectionCount: 1,
      },
    ]),
  )
  expect(await writtenAnswerOptionStatistics(first.revisionId)).toHaveLength(2)
})

test('written answers on either side of Warsaw midnight count on separate study days', async () => {
  const fixture = await createStudyFixture(studySessionSpecialization)
  const question = await addFixtureQuestion(fixture.pathId, fixture.documentId)
  await addFixtureQuestion(fixture.pathId, fixture.documentId)

  await (await learnerInSession(fixture, lastMinuteOfDay)).answer(question.revisionId, 'A')
  await (await learnerInSession(fixture, firstMinuteOfNextDay)).answer(question.revisionId, 'B')

  expect(await writtenQuestionStatistics(question.revisionId)).toEqual([
    {
      mode: 'study',
      assistance: 'none',
      studyDay: DateTime.makeUnsafe('2026-11-12T23:00:00.000Z'),
      answerCount: 1,
      correctCount: 1,
    },
    {
      mode: 'study',
      assistance: 'none',
      studyDay: DateTime.makeUnsafe('2026-11-13T23:00:00.000Z'),
      answerCount: 1,
      correctCount: 0,
    },
  ])
})
