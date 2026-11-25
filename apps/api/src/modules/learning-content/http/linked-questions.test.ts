import {
  DocumentQuestionCountsResponse,
  LinkedOralQuestionsResponse,
  LinkedWrittenQuestionsResponse,
} from '@inzpro/api-contracts/modules/learning-content/responses'
import { OralQuestionDetails } from '@inzpro/api-contracts/modules/oral-study/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { QuestionDetails } from '@inzpro/api-contracts/modules/written-study/responses'
import type { ExamAccessScope } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { paragraphs } from '@inzpro/rich-content/rich-content'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi, type TestVisitor } from '~api/test/api-server.js'
import { addFixtureReferenceDocument } from '~api/test/content-fixtures.js'
import { addFixtureOralCategory, addFixtureOralQuestion } from '~api/test/oral-learning-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'
import { addFixtureQuestion, withdrawFixtureRevision } from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const apiRequest = (
  visitor: TestVisitor,
  path: string,
  init?: { method: string; body?: unknown },
) =>
  visitor.jar.fetch(
    new URL(`/api/v1${path}`, api.baseUrl),
    init === undefined
      ? undefined
      : {
          method: init.method,
          headers: { 'content-type': 'application/json' },
          body: init.body === undefined ? undefined : JSON.stringify(init.body),
        },
  )

const basis = (documentId: string, address: string) => ({
  documentId,
  address,
  page: null,
  kind: 'direct_basis' as const,
  isCritical: false,
})

const linkedQuestionFixture = async () => {
  const fixture = await createStudyFixture()
  const otherPath = await createStudyFixture(studySessionSpecialization)

  const statute = await addFixtureReferenceDocument(fixture.pathId, {
    sections: [
      { address: 'art:5', content: paragraphs('Artykuł piąty') },
      { address: 'art:5/ust:1', parentAddress: 'art:5', content: paragraphs('Ustęp pierwszy') },
      { address: 'art:55', content: paragraphs('Artykuł pięćdziesiąty piąty') },
      { address: 'art:6', content: paragraphs('Artykuł szósty') },
    ],
  })

  const written = await addFixtureQuestion(
    fixture.pathId,
    fixture.documentId,
    true,
    paragraphs('Wyjaśnienie pytania pisemnego'),
    [basis(statute.id, 'art:5/ust:1'), { ...basis(statute.id, 'art:5/ust:1'), kind: 'aid' }],
  )

  const secondWritten = await addFixtureQuestion(
    fixture.pathId,
    fixture.documentId,
    true,
    paragraphs('Fixture'),
    [basis(statute.id, 'art:5/ust:1'), basis(statute.id, 'art:6')],
  )

  const wholeArticle = await addFixtureQuestion(
    fixture.pathId,
    fixture.documentId,
    true,
    undefined,
    [basis(statute.id, 'art:5')],
  )

  await addFixtureQuestion(fixture.pathId, fixture.documentId, true, undefined, [
    basis(statute.id, 'art:55'),
  ])

  const withdrawn = await addFixtureQuestion(fixture.pathId, fixture.documentId, true, undefined, [
    basis(statute.id, 'art:5/ust:1'),
  ])

  await withdrawFixtureRevision(withdrawn.revisionId)

  await addFixtureQuestion(fixture.pathId, fixture.documentId, false, undefined, [
    basis(statute.id, 'art:5/ust:1'),
  ])

  await addFixtureQuestion(otherPath.pathId, otherPath.documentId, true, undefined, [
    basis(statute.id, 'art:5/ust:1'),
  ])

  const oral = await addFixtureOralQuestion(
    fixture.pathId,
    await addFixtureOralCategory(),
    1,
    true,
    paragraphs('Przygotowana odpowiedź ustna'),
    [basis(statute.id, 'art:5/ust:1')],
  )

  return { fixture, statute, written, secondWritten, wholeArticle, oral }
}

const onboard = async (
  config: CompleteOnboardingPayload,
  accessScope: ExamAccessScope = config.accessScope,
) => {
  const learner = await loginForPreparation(api)

  await learningRequest(
    api,
    learner,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)({ ...config, accessScope }),
  )

  return learner
}

const LinkedPage = Schema.Struct({
  data: Schema.Array(Schema.Unknown),
  meta: Schema.Struct({ nextCursor: Schema.NullOr(Schema.String) }),
})

const linkedPages = async (learner: TestVisitor, path: string, address: string) => {
  const questions: Array<unknown> = []
  let cursor: string | undefined

  do {
    const query = new URLSearchParams({ address, limit: '1' })

    if (cursor !== undefined) {
      query.set('cursor', cursor)
    }

    const response = await apiRequest(learner, `${path}?${query.toString()}`)

    expect(response.status).toBe(200)

    const page = Schema.decodeUnknownSync(LinkedPage)(await response.json())
    questions.push(...page.data)
    cursor = page.meta.nextCursor ?? undefined
  } while (cursor !== undefined)

  return questions
}

const linkedWrittenQuestions = async (
  learner: TestVisitor,
  pathId: QualificationPathId,
  code: string,
  address: string,
) =>
  Schema.decodeUnknownSync(LinkedWrittenQuestionsResponse.fields.data)(
    await linkedPages(
      learner,
      `/sources/paths/${pathId}/documents/${code}/written-questions`,
      address,
    ),
  )

const linkedOralQuestions = async (
  learner: TestVisitor,
  pathId: QualificationPathId,
  code: string,
  address: string,
) =>
  Schema.decodeUnknownSync(LinkedOralQuestionsResponse.fields.data)(
    await linkedPages(
      learner,
      `/sources/paths/${pathId}/documents/${code}/oral-questions`,
      address,
    ),
  )

const questionCounts = async (learner: TestVisitor, pathId: QualificationPathId, code: string) => {
  const response = await apiRequest(
    learner,
    `/sources/paths/${pathId}/documents/${code}/question-counts`,
  )

  expect(response.status).toBe(200)

  return Schema.decodeUnknownSync(DocumentQuestionCountsResponse)(await response.json()).units
}

const writtenLinks = (...questionIds: ReadonlyArray<string>) =>
  questionIds.toSorted().map(questionId => ({ questionId, body: 'Test-only question' }))

test('the questions linked to a unit or its nested units are the published questions of the path, listed per exam part', async () => {
  const { fixture, statute, written, secondWritten, wholeArticle, oral } =
    await linkedQuestionFixture()

  const learner = await onboard(fixture.config, 'both')

  const oralLink = {
    questionId: oral.id,
    body: { content: paragraphs('Test-only oral question'), assets: [] },
  }

  expect(
    await linkedWrittenQuestions(learner, fixture.pathId, statute.code, 'art:5/ust:1'),
  ).toEqual(writtenLinks(written.id, secondWritten.id))
  expect(await linkedWrittenQuestions(learner, fixture.pathId, statute.code, 'art:5')).toEqual(
    writtenLinks(written.id, secondWritten.id, wholeArticle.id),
  )
  expect(await linkedOralQuestions(learner, fixture.pathId, statute.code, 'art:5')).toEqual([
    oralLink,
  ])
  expect(await linkedOralQuestions(learner, fixture.pathId, statute.code, 'art:6')).toEqual([])
  expect(await questionCounts(learner, fixture.pathId, statute.code)).toEqual([
    { address: 'art:5', writtenQuestionCount: 3, oralQuestionCount: 1 },
    { address: 'art:5/ust:1', writtenQuestionCount: 2, oralQuestionCount: 1 },
    { address: 'art:55', writtenQuestionCount: 1, oralQuestionCount: 0 },
    { address: 'art:6', writtenQuestionCount: 1, oralQuestionCount: 0 },
  ])
})

test('each exam part outside the access scope counts zero and its list is refused', async () => {
  const { fixture, statute, oral } = await linkedQuestionFixture()
  const writtenOnly = await onboard(fixture.config, 'written')
  const oralOnly = await onboard(fixture.config, 'oral')

  expect(await questionCounts(writtenOnly, fixture.pathId, statute.code)).toEqual([
    { address: 'art:5', writtenQuestionCount: 3, oralQuestionCount: 0 },
    { address: 'art:5/ust:1', writtenQuestionCount: 2, oralQuestionCount: 0 },
    { address: 'art:55', writtenQuestionCount: 1, oralQuestionCount: 0 },
    { address: 'art:6', writtenQuestionCount: 1, oralQuestionCount: 0 },
  ])
  expect(await questionCounts(oralOnly, fixture.pathId, statute.code)).toEqual([
    { address: 'art:5', writtenQuestionCount: 0, oralQuestionCount: 1 },
    { address: 'art:5/ust:1', writtenQuestionCount: 0, oralQuestionCount: 1 },
  ])
  expect(await linkedOralQuestions(oralOnly, fixture.pathId, statute.code, 'art:5')).toEqual([
    { questionId: oral.id, body: { content: paragraphs('Test-only oral question'), assets: [] } },
  ])

  const refusedOral = await apiRequest(
    writtenOnly,
    `/sources/paths/${fixture.pathId}/documents/${statute.code}/oral-questions?address=art%3A5`,
  )

  const refusedWritten = await apiRequest(
    oralOnly,
    `/sources/paths/${fixture.pathId}/documents/${statute.code}/written-questions?address=art%3A5`,
  )

  expect(refusedOral.status).toBe(403)
  expect(refusedWritten.status).toBe(403)
})

test('linked questions of a document outside the path are not readable', async () => {
  const { fixture } = await linkedQuestionFixture()
  const learner = await onboard(fixture.config)

  const offPath = await addFixtureReferenceDocument(undefined, {
    sections: [{ address: 'art:1', content: paragraphs('Poza ścieżką') }],
  })

  const listed = await apiRequest(
    learner,
    `/sources/paths/${fixture.pathId}/documents/${offPath.code}/written-questions?address=art%3A1`,
  )

  const counted = await apiRequest(
    learner,
    `/sources/paths/${fixture.pathId}/documents/${offPath.code}/question-counts`,
  )

  expect(listed.status).toBe(404)
  expect(counted.status).toBe(404)
})

test('question details show the answer with the chips and keep favourites and notes', async () => {
  const { fixture, statute, written, oral } = await linkedQuestionFixture()
  const learner = await onboard(fixture.config)

  const writtenDetails = async () => {
    const response = await apiRequest(
      learner,
      `/study/paths/${fixture.pathId}/questions/${written.id}`,
    )

    expect(response.status).toBe(200)

    return Schema.decodeUnknownSync(QuestionDetails)(await response.json())
  }

  const oralDetails = async () => {
    const response = await apiRequest(
      learner,
      `/study/paths/${fixture.pathId}/oral/questions/${oral.id}`,
    )

    expect(response.status).toBe(200)

    return Schema.decodeUnknownSync(OralQuestionDetails)(await response.json())
  }

  expect(await writtenDetails()).toMatchObject({
    questionId: written.id,
    questionRevisionId: written.revisionId,
    body: 'Test-only question',
    answers: written.answers
      .toSorted((left, right) => left.id.localeCompare(right.id))
      .map(({ id, text, isCorrect }) => ({ id, text, isCorrect })),
    explanation: { content: paragraphs('Wyjaśnienie pytania pisemnego'), assets: [] },
    references: [
      { document: { code: statute.code }, address: 'art:5/ust:1', kind: 'direct_basis' },
      { document: { code: statute.code }, address: 'art:5/ust:1', kind: 'aid' },
    ],
    isFavorite: false,
    note: null,
  })
  expect(await oralDetails()).toMatchObject({
    questionId: oral.id,
    oralRevisionId: oral.revisionId,
    body: { content: paragraphs('Test-only oral question'), assets: [] },
    answer: { content: paragraphs('Przygotowana odpowiedź ustna'), assets: [] },
    references: [{ document: { code: statute.code }, address: 'art:5/ust:1' }],
    isFavorite: false,
    note: null,
  })

  await apiRequest(learner, `/study/paths/${fixture.pathId}/favorites/${written.id}`, {
    method: 'PUT',
  })
  await apiRequest(learner, `/study/paths/${fixture.pathId}/notes/${written.id}`, {
    method: 'PUT',
    body: { text: 'Notatka z karty pisemnej' },
  })
  await apiRequest(learner, `/study/paths/${fixture.pathId}/oral/favorites/${oral.id}`, {
    method: 'PUT',
  })
  await apiRequest(learner, `/study/paths/${fixture.pathId}/oral/notes/${oral.id}`, {
    method: 'PUT',
    body: { text: 'Notatka z karty ustnej' },
  })

  expect(await writtenDetails()).toMatchObject({
    isFavorite: true,
    note: { text: 'Notatka z karty pisemnej', refersToEarlierWording: false },
  })
  expect(await oralDetails()).toMatchObject({
    isFavorite: true,
    note: { text: 'Notatka z karty ustnej', refersToEarlierWording: false },
  })
})

test('question details outside the path or the access scope is not readable', async () => {
  const { fixture, written, oral } = await linkedQuestionFixture()
  const otherPath = await createStudyFixture(studySessionSpecialization)
  const offPath = await addFixtureQuestion(otherPath.pathId, otherPath.documentId)
  const writtenOnly = await onboard(fixture.config, 'written')

  const offPathDetails = await apiRequest(
    writtenOnly,
    `/study/paths/${fixture.pathId}/questions/${offPath.id}`,
  )

  const oralDetails = await apiRequest(
    writtenOnly,
    `/study/paths/${fixture.pathId}/oral/questions/${oral.id}`,
  )

  const writtenDetails = await apiRequest(
    writtenOnly,
    `/study/paths/${fixture.pathId}/questions/${written.id}`,
  )

  expect(offPathDetails.status).toBe(404)
  expect(oralDetails.status).toBe(403)
  expect(writtenDetails.status).toBe(200)
})

test('opening question details leaves the learning state unchanged', async () => {
  const { fixture, written, oral } = await linkedQuestionFixture()
  const learner = await onboard(fixture.config)

  const learningState = async () =>
    Promise.all(
      [
        `/study/paths/${fixture.pathId}/documents/${fixture.documentId}`,
        `/study/paths/${fixture.pathId}/review-preview`,
        `/study/paths/${fixture.pathId}/oral/review-preview`,
        `/study/paths/${fixture.pathId}/latest-session`,
        `/study/paths/${fixture.pathId}/oral/latest-session`,
        `/study/paths/${fixture.pathId}/daily-plan`,
        `/study/paths/${fixture.pathId}/oral/daily-plan`,
        '/learning-xp',
        '/streak',
      ].map(async path => {
        const response = await apiRequest(learner, path)

        return { path, status: response.status, body: await response.text() }
      }),
    )

  const before = await learningState()

  for (const path of [
    `/study/paths/${fixture.pathId}/questions/${written.id}`,
    `/study/paths/${fixture.pathId}/oral/questions/${oral.id}`,
  ]) {
    expect((await apiRequest(learner, path)).status).toBe(200)
  }

  expect(await learningState()).toEqual(before)
})
