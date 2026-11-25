import {
  OralMaterialsResponse,
  OralSessionNextStepResponse,
  OralSessionPreview,
  OralSessionQuestion,
  OralSessionResultsResponse,
  OralStudySession,
  OralStudySessionSummaryResponse,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { maximumPageLimit } from '@inzpro/domain/common/pagination'
import type { OralSelfAssessment } from '@inzpro/domain/modules/oral-study/oral-study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { paragraphs } from '@inzpro/rich-content/rich-content'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, onTestFinished, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { addFixtureReferenceDocument } from '~api/test/content-fixtures.js'
import {
  addFixtureOralCategory,
  addFixtureOralQuestion,
  publishFixtureOralRevision,
  storedOralLearningRound,
  withdrawFixtureOralRevision,
} from '~api/test/oral-learning-fixtures.js'
import { seededFixturePath } from '~api/test/preparation-fixtures.js'
import {
  learningRequest,
  loginForPreparation,
  technicalConfiguration,
} from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const wholePathSpecializations = {
  completion: '60000000-0000-4000-8000-000000000007',
  withdrawal: '60000000-0000-4000-8000-000000000008',
  nextStep: '60000000-0000-4000-8000-000000000009',
}

const sharedPathSpecialization = '60000000-0000-4000-8000-000000000003'

const seededCategories = [
  '32000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000002',
  '32000000-0000-4000-8000-000000000003',
]

const learnerOnPath = async (
  specializationId = sharedPathSpecialization,
  accessScope: typeof CompleteOnboardingPayload.Encoded.accessScope = 'both',
) => {
  const visitor = await loginForPreparation(api)

  const { pathId, config } = await seededFixturePath({
    ...technicalConfiguration,
    specializationId,
  })

  await learningRequest(api, visitor, '/onboarding', {
    ...Schema.encodeSync(CompleteOnboardingPayload)(config),
    accessScope,
  })

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${pathId}/oral${path}`, body)

  const json = async <S extends Schema.Decoder<unknown>>(
    schema: S,
    response: Response,
  ): Promise<S['Type']> => {
    expect(response.status).toBe(200)

    return Schema.decodeUnknownSync(schema)(await response.json())
  }

  const preview = async (query = '') =>
    json(Schema.NullOr(OralSessionPreview), await request(`/preview${query}`))

  const categories = async () =>
    Schema.decodeUnknownSync(Schema.toCodecJson(OralMaterialsResponse))(
      await (await request(`?limit=${maximumPageLimit}`)).json(),
    ).data

  const start = (categoryId: string, questionCount: number) =>
    request('/sessions', { categoryId, questionCount })

  const startDefault = async (categoryId: string) => {
    const offered = await preview(`?categoryId=${categoryId}`)

    return json(
      OralStudySession,
      await start(categoryId, offered?.settings.defaultQuestionCount ?? 0),
    )
  }

  const question = async (sessionId: string, position: number) =>
    json(OralSessionQuestion, await request(`/sessions/${sessionId}/questions/${position}`))

  const assess = async (
    sessionId: string,
    position: number,
    selfAssessment: OralSelfAssessment = 'easy',
  ) => {
    const shown = await question(sessionId, position)

    return request(`/sessions/${sessionId}/questions/${position}/self-assessment`, {
      oralRevisionId: shown.oralRevisionId,
      selfAssessment,
    })
  }

  const end = (sessionId: string) => request(`/sessions/${sessionId}/end`, {})

  const coverCategory = async (categoryId: string) => {
    const session = await startDefault(categoryId)

    for (let position = 1; position <= session.progress.total; position++) {
      await assess(session.id, position)
    }

    await end(session.id)
  }

  const round = () => storedOralLearningRound(visitor.userId, pathId)

  return {
    pathId,
    request,
    json,
    preview,
    categories,
    start,
    startDefault,
    question,
    assess,
    end,
    coverCategory,
    round,
  }
}

const categoryWithQuestions = async (pathId: QualificationPathId, count: number) => {
  const categoryId = await addFixtureOralCategory('Test-only oral session category')
  const questions = []

  for (let position = 1; position <= count; position++) {
    questions.push(await addFixtureOralQuestion(pathId, categoryId, position))
  }

  return { categoryId, questions }
}

test('the preview proposes ten questions of a larger category and all of a smaller one', async () => {
  const learner = await learnerOnPath()
  const large = await categoryWithQuestions(learner.pathId, 12)
  const small = await categoryWithQuestions(learner.pathId, 4)

  expect(await learner.preview(`?categoryId=${large.categoryId}`)).toMatchObject({
    category: { id: large.categoryId, availableQuestionCount: 12, completedQuestionCount: 0 },
    settings: {
      defaultQuestionCount: 10,
      canChangeQuestionCount: true,
      minimumQuestionCount: 1,
      maximumQuestionCount: 12,
    },
  })
  expect(await learner.preview(`?categoryId=${small.categoryId}`)).toMatchObject({
    settings: {
      defaultQuestionCount: 4,
      canChangeQuestionCount: false,
      minimumQuestionCount: 4,
      maximumQuestionCount: 4,
    },
  })

  const stale = await learner.start(small.categoryId, 3)
  expect(stale.status).toBe(409)
  expect(await stale.json()).toMatchObject({ type: 'stale_session_preview' })

  const chosen = await learner.json(OralStudySession, await learner.start(large.categoryId, 12))
  expect(chosen.progress.total).toBe(12)
})

test('a session draws questions uncovered in the current round first, in catalogue order', async () => {
  const learner = await learnerOnPath()
  const { categoryId, questions } = await categoryWithQuestions(learner.pathId, 3)

  const first = await learner.startDefault(categoryId)
  expect((await learner.question(first.id, 1)).questionId).toBe(questions[0]!.id)

  await learner.assess(first.id, 2)
  await learner.end(first.id)

  expect(await learner.preview(`?categoryId=${categoryId}`)).toMatchObject({
    category: { availableQuestionCount: 3, completedQuestionCount: 1 },
  })
  expect((await learner.categories()).find(category => category.id === categoryId)).toMatchObject({
    availableQuestionCount: 3,
    completedQuestionCount: 1,
  })

  const next = await learner.startDefault(categoryId)
  const drawn = await Promise.all([1, 2, 3].map(position => learner.question(next.id, position)))

  expect(drawn.map(shown => shown.questionId)).toEqual([
    questions[0]!.id,
    questions[2]!.id,
    questions[1]!.id,
  ])
})

test('a category keeps one unfinished session and other categories can start their own', async () => {
  const learner = await learnerOnPath()
  const first = await categoryWithQuestions(learner.pathId, 2)
  const second = await categoryWithQuestions(learner.pathId, 2)

  const session = await learner.startDefault(first.categoryId)
  await learner.assess(session.id, 1)

  const again = await learner.start(first.categoryId, 2)
  expect(again.status).toBe(409)
  expect(await again.json()).toMatchObject({
    type: 'oral_session_already_started',
    sessionId: session.id,
    currentPosition: 2,
  })

  const other = await learner.start(second.categoryId, 2)
  expect(other.status).toBe(200)

  expect(
    await learner.json(
      OralStudySession,
      await learner.request(`/latest-session?categoryId=${first.categoryId}`),
    ),
  ).toMatchObject({ id: session.id, status: 'active', progress: { answered: 1 } })

  await learner.end(session.id)
  expect((await learner.start(first.categoryId, 2)).status).toBe(200)
})

test('a self-assessment is final: a retry returns it and a different one is refused', async () => {
  const learner = await learnerOnPath()
  const { categoryId } = await categoryWithQuestions(learner.pathId, 2)
  const session = await learner.startDefault(categoryId)
  const shown = await learner.question(session.id, 1)

  expect(shown.selfAssessment).toBeNull()
  expect(shown.answer.content).toMatchObject({ doc: { type: 'doc' } })

  const submit = (selfAssessment: OralSelfAssessment, oralRevisionId = shown.oralRevisionId) =>
    learner.request(`/sessions/${session.id}/questions/1/self-assessment`, {
      oralRevisionId,
      selfAssessment,
    })

  const stored = await submit('medium')
  expect(stored.status).toBe(200)
  expect(await stored.json()).toMatchObject({
    question: { selfAssessment: { value: 'medium' } },
    session: { progress: { answered: 1, currentQuestion: 2 } },
  })

  const retry = await submit('medium')
  expect(retry.status).toBe(200)

  const different = await submit('easy')
  expect(different.status).toBe(409)
  expect(await different.json()).toMatchObject({ type: 'oral_self_assessment_already_submitted' })

  expect((await learner.question(session.id, 1)).selfAssessment).toMatchObject({
    value: 'medium',
  })

  const otherRevision = await learner.request(
    `/sessions/${session.id}/questions/2/self-assessment`,
    { oralRevisionId: shown.oralRevisionId, selfAssessment: 'easy' },
  )

  expect(otherRevision.status).toBe(422)
  expect(await otherRevision.json()).toMatchObject({ type: 'invalid_oral_self_assessment' })
})

test('an ended session keeps its self-assessments in the summary and accepts no more', async () => {
  const learner = await learnerOnPath()
  const { categoryId } = await categoryWithQuestions(learner.pathId, 4)
  const session = await learner.startDefault(categoryId)

  await learner.assess(session.id, 1, 'hard')
  await learner.assess(session.id, 2, 'medium')
  await learner.assess(session.id, 3, 'easy')

  expect(
    await learner.json(
      OralStudySessionSummaryResponse,
      await learner.request(`/sessions/${session.id}/summary`),
    ),
  ).toBeNull()

  await learner.end(session.id)

  expect(
    await learner.json(
      OralStudySessionSummaryResponse,
      await learner.request(`/sessions/${session.id}/summary`),
    ),
  ).toMatchObject({
    status: 'ended',
    category: { id: categoryId },
    progress: { total: 4, answered: 3 },
    result: { hard: 1, medium: 1, easy: 1 },
  })

  const results = Schema.decodeUnknownSync(Schema.toCodecJson(OralSessionResultsResponse))(
    await (await learner.request(`/sessions/${session.id}/results`)).json(),
  )

  expect(results.data.map(result => result.selfAssessment)).toEqual([
    'hard',
    'medium',
    'easy',
    null,
  ])

  const late = await learner.assess(session.id, 4)
  expect(late.status).toBe(409)
  expect(await late.json()).toMatchObject({ type: 'study_session_ended' })
})

test('a question withdrawn in a started session is skipped and refuses a self-assessment', async () => {
  const learner = await learnerOnPath()
  const { categoryId, questions } = await categoryWithQuestions(learner.pathId, 2)
  const session = await learner.startDefault(categoryId)

  await withdrawFixtureOralRevision(questions[0]!.revisionId)

  const refused = await learner.assess(session.id, 1)
  expect(refused.status).toBe(409)
  expect(await refused.json()).toMatchObject({ type: 'session_question_withdrawn' })
  expect((await learner.question(session.id, 1)).isWithdrawn).toBe(true)

  const stored = await learner.json(
    Schema.Struct({ session: OralStudySession }),
    await learner.assess(session.id, 2),
  )

  expect(stored.session.progress).toMatchObject({ answered: 1, skipped: 1, percent: 100 })
})

test('covering the last uncovered questions concurrently advances the oral round once', async () => {
  const learner = await learnerOnPath(wholePathSpecializations.completion)
  const [last, ...others] = seededCategories.toReversed()

  for (const categoryId of others) {
    await learner.coverCategory(categoryId)
  }

  const session = await learner.startDefault(last!)

  for (const position of [1, 2]) {
    await learner.assess(session.id, position)
  }

  expect(await learner.round()).toBe(1)

  const responses = await Promise.all([
    learner.assess(session.id, 3, 'hard'),
    learner.assess(session.id, 4, 'medium'),
  ])

  expect(responses.map(response => response.status)).toEqual([200, 200])
  expect(await learner.round()).toBe(2)
  expect((await learner.categories()).map(category => category.completedQuestionCount)).toEqual([
    0, 0, 0,
  ])
})

test('a withdrawn question does not block the oral round', async () => {
  const learner = await learnerOnPath(wholePathSpecializations.withdrawal)
  const added = await categoryWithQuestions(learner.pathId, 2)

  onTestFinished(() => withdrawFixtureOralRevision(added.questions[0]!.revisionId))

  for (const categoryId of seededCategories) {
    await learner.coverCategory(categoryId)
  }

  const session = await learner.startDefault(added.categoryId)
  await learner.assess(session.id, 1)

  expect(await learner.round()).toBe(1)

  await withdrawFixtureOralRevision(added.questions[1]!.revisionId)

  expect(
    (await learner.categories()).every(category => category.completedQuestionCount === 0),
  ).toBe(true)

  await learner.end(session.id)
  const next = await learner.startDefault(seededCategories[0]!)
  await learner.assess(next.id, 1)

  expect(await learner.round()).toBe(2)
})

test('a substantive revision uncovers the question in the current oral round and a cosmetic one does not', async () => {
  const learner = await learnerOnPath()
  const { categoryId, questions } = await categoryWithQuestions(learner.pathId, 1)

  await learner.coverCategory(categoryId)

  const progress = async () => (await learner.preview(`?categoryId=${categoryId}`))?.category

  expect(await progress()).toMatchObject({ completedQuestionCount: 1 })

  await publishFixtureOralRevision(questions[0]!.id, 'cosmetic')
  expect(await progress()).toMatchObject({ completedQuestionCount: 1 })

  const substantive = await publishFixtureOralRevision(questions[0]!.id, 'substantive')
  expect(await progress()).toMatchObject({ completedQuestionCount: 0 })

  const session = await learner.startDefault(categoryId)
  expect((await learner.question(session.id, 1)).oralRevisionId).toBe(substantive.revisionId)
})

test('the step after a session continues an unfinished one, otherwise the next category', async () => {
  const learner = await learnerOnPath(wholePathSpecializations.nextStep)
  const [first, second, third] = seededCategories

  const finished = await learner.startDefault(first!)
  await learner.end(finished.id)

  const nextStep = async () =>
    learner.json(
      OralSessionNextStepResponse,
      await learner.request(`/sessions/${finished.id}/next-step`),
    )

  expect(await nextStep()).toMatchObject({
    type: 'start-study',
    preview: { category: { id: first } },
  })

  await learner.coverCategory(first!)

  expect(await nextStep()).toMatchObject({
    type: 'start-study',
    preview: { category: { id: second } },
  })

  const unfinished = await learner.startDefault(third!)

  expect(await nextStep()).toMatchObject({
    type: 'continue-study',
    session: { id: unfinished.id, category: { id: third } },
  })
})

test('learners with only written access cannot study oral questions', async () => {
  const learner = await learnerOnPath(undefined, 'written')

  expect((await learner.request('/preview')).status).toBe(403)
  expect((await learner.start(seededCategories[0]!, 4)).status).toBe(403)
})

test('an oral session question carries its references, with a unit missing from the current edition left unlinked', async () => {
  const learner = await learnerOnPath()

  const statute = await addFixtureReferenceDocument(learner.pathId, {
    sections: [{ address: 'art:20', content: paragraphs('Obowiązki projektanta') }],
  })

  const categoryId = await addFixtureOralCategory('Test-only oral references category')

  await addFixtureOralQuestion(
    learner.pathId,
    categoryId,
    1,
    true,
    paragraphs('Test-only oral answer'),
    [
      {
        documentId: statute.id,
        address: 'art:20',
        page: null,
        kind: 'direct_basis',
        isCritical: true,
      },
      { documentId: statute.id, address: 'art:21', page: null, kind: 'aid', isCritical: false },
    ],
  )

  const session = await learner.startDefault(categoryId)
  const shown = await learner.question(session.id, 1)

  expect(shown.references).toEqual([
    {
      document: { code: statute.code, abbreviation: 'TEST', title: statute.title },
      address: 'art:20',
      page: null,
      kind: 'direct_basis',
      isCritical: true,
      isLinked: true,
      fragment: [
        {
          address: 'art:20',
          parentAddress: null,
          title: null,
          content: { content: paragraphs('Obowiązki projektanta'), assets: [] },
        },
      ],
    },
    {
      document: { code: statute.code, abbreviation: 'TEST', title: statute.title },
      address: 'art:21',
      page: null,
      kind: 'aid',
      isCritical: false,
      isLinked: false,
      fragment: null,
    },
  ])
})
