import {
  AnswerOralQuizCheckResponse,
  OralQuizChecksResponse,
  OralSessionQuestion,
  OralStudySession,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import {
  addFixtureAsset,
  contentWithImage,
  expectStoredImageAddress,
} from '~api/test/content-fixtures.js'
import {
  addFixtureKnowledgeCheck,
  addFixtureOralCategory,
  addFixtureOralQuestion,
} from '~api/test/oral-learning-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const oralLearner = async (answer?: ReturnType<typeof contentWithImage>) => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  const categoryId = await addFixtureOralCategory()
  const question = await addFixtureOralQuestion(fixture.pathId, categoryId, 1, true, answer)

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${fixture.pathId}/oral${path}`, body)

  const session = Schema.decodeUnknownSync(OralStudySession)(
    await (await request('/sessions', { categoryId, questionCount: 1 })).json(),
  )

  const shownQuestion = async () =>
    Schema.decodeUnknownSync(OralSessionQuestion)(
      await (await request(`/sessions/${session.id}/questions/1`)).json(),
    )

  return { fixture, question, request, session, shownQuestion }
}

test('a prepared oral answer reads back with a signed address for its image', async () => {
  const assetId = await addFixtureAsset()
  const learner = await oralLearner(contentWithImage(assetId))

  await expectStoredImageAddress((await learner.shownQuestion()).answer, assetId)

  const outsider = await loginForPreparation(api)

  const outsiderRead = await learningRequest(
    api,
    outsider,
    `/paths/${learner.fixture.pathId}/oral/sessions/${learner.session.id}/questions/1`,
  )

  expect(outsiderRead.status).toBe(403)
  expect(await outsiderRead.text()).not.toContain(assetId)
})

test('a quiz check explanation gets an image address only once the check is answered', async () => {
  const assetId = await addFixtureAsset()
  const learner = await oralLearner()

  await addFixtureKnowledgeCheck(
    learner.question.id,
    learner.question.revisionId,
    'true_false',
    [
      { text: 'Prawda', isCorrect: true },
      { text: 'Fałsz', isCorrect: false },
    ],
    true,
    contentWithImage(assetId),
  )

  await learner.request(`/sessions/${learner.session.id}/questions/1/self-assessment`, {
    oralRevisionId: (await learner.shownQuestion()).oralRevisionId,
    selfAssessment: 'easy',
  })
  await learner.request(`/sessions/${learner.session.id}/end`, {})
  await learner.request(`/sessions/${learner.session.id}/quiz`, { formats: ['true_false'] })

  const readChecks = async () => {
    const response = await learner.request(`/sessions/${learner.session.id}/quiz/checks`)
    const body = await response.text()

    return {
      body,
      checks: Schema.decodeUnknownSync(Schema.toCodecJson(OralQuizChecksResponse))(JSON.parse(body))
        .data,
    }
  }

  const unanswered = await readChecks()

  expect(unanswered.checks[0]?.result).toBeNull()
  expect(unanswered.body).not.toContain(assetId)

  const correctOption = unanswered.checks[0]?.options.find(option => option.text === 'Prawda')

  const answered = Schema.decodeUnknownSync(AnswerOralQuizCheckResponse)(
    await (
      await learner.request(`/sessions/${learner.session.id}/quiz/checks/1/answer`, {
        optionIds: [correctOption?.id],
      })
    ).json(),
  )

  await expectStoredImageAddress(answered.check.result!.explanation, assetId)

  const revealed = (await readChecks()).checks[0]?.result?.explanation

  await expectStoredImageAddress(revealed!, assetId)
})
