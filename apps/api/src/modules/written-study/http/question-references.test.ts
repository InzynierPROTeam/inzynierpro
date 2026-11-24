import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  SessionQuestion,
  StudySession,
  SubmitSessionAnswerResponse,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { pdfOnlyAvailability } from '@inzpro/domain/modules/learning-content/document-edition'
import { paragraphs } from '@inzpro/rich-content/rich-content'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { addFixturePdfAsset, addFixtureReferenceDocument } from '~api/test/content-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'
import { addFixtureQuestion } from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

test('a written session question carries its references resolved against the current editions on the path', async () => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)

  const statute = await addFixtureReferenceDocument(fixture.pathId, {
    sections: [
      { address: 'art:5', content: paragraphs('Artykuł piąty') },
      { address: 'art:5/ust:1', parentAddress: 'art:5', content: paragraphs('Ustęp pierwszy') },
      {
        address: 'art:5/ust:1/pkt:1',
        parentAddress: 'art:5/ust:1',
        content: paragraphs('Punkt pierwszy'),
      },
      { address: 'art:5/ust:2', parentAddress: 'art:5', content: paragraphs('Ustęp drugi') },
    ],
  })

  const pdf = await addFixtureReferenceDocument(fixture.pathId, {
    availability: pdfOnlyAvailability,
    pdfAssetId: await addFixturePdfAsset(),
  })

  const offPath = await addFixtureReferenceDocument(undefined, {
    sections: [{ address: 'art:1', content: paragraphs('Poza ścieżką') }],
  })

  const question = await addFixtureQuestion(
    fixture.pathId,
    fixture.documentId,
    true,
    paragraphs('Wyjaśnienie'),
    [
      {
        documentId: statute.id,
        address: 'art:5/ust:1',
        page: null,
        kind: 'direct_basis',
        isCritical: true,
      },
      { documentId: statute.id, address: 'art:99', page: null, kind: 'aid', isCritical: false },
      { documentId: pdf.id, address: null, page: 2, kind: 'aid', isCritical: false },
      { documentId: offPath.id, address: 'art:1', page: null, kind: 'topic', isCritical: false },
      { documentId: statute.id, address: null, page: null, kind: 'topic', isCritical: false },
    ],
  )

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${fixture.pathId}${path}`, body)

  const session = Schema.decodeUnknownSync(StudySession)(
    await (
      await request('/sessions', {
        documentId: fixture.documentId,
        questionCount: 1,
        questionSelection: 'uncovered',
      })
    ).json(),
  )

  const shown = Schema.decodeUnknownSync(SessionQuestion)(
    await (await request(`/sessions/${session.id}/questions/1`)).json(),
  )

  const expectedReferences = [
    {
      document: { code: statute.code, abbreviation: 'TEST', title: statute.title },
      address: 'art:5/ust:1',
      page: null,
      kind: 'direct_basis',
      isCritical: true,
      isLinked: true,
      fragment: [
        {
          address: 'art:5/ust:1',
          parentAddress: 'art:5',
          title: null,
          content: { content: paragraphs('Ustęp pierwszy'), assets: [] },
        },
        {
          address: 'art:5/ust:1/pkt:1',
          parentAddress: 'art:5/ust:1',
          title: null,
          content: { content: paragraphs('Punkt pierwszy'), assets: [] },
        },
      ],
    },
    {
      document: { code: statute.code, abbreviation: 'TEST', title: statute.title },
      address: 'art:99',
      page: null,
      kind: 'aid',
      isCritical: false,
      isLinked: false,
      fragment: null,
    },
    {
      document: { code: pdf.code, abbreviation: 'TEST', title: pdf.title },
      address: null,
      page: 2,
      kind: 'aid',
      isCritical: false,
      isLinked: true,
      fragment: null,
    },
    {
      document: { code: offPath.code, abbreviation: 'TEST', title: offPath.title },
      address: 'art:1',
      page: null,
      kind: 'topic',
      isCritical: false,
      isLinked: false,
      fragment: null,
    },
    {
      document: { code: statute.code, abbreviation: 'TEST', title: statute.title },
      address: null,
      page: null,
      kind: 'topic',
      isCritical: false,
      isLinked: true,
      fragment: null,
    },
  ]

  expect(shown.questionRevisionId).toBe(question.revisionId)
  expect(shown.references).toEqual(expectedReferences)

  const answered = Schema.decodeUnknownSync(SubmitSessionAnswerResponse)(
    await (
      await request(`/sessions/${session.id}/questions/1/answer`, {
        questionRevisionId: shown.questionRevisionId,
        answerId: shown.answers[0]?.id,
      })
    ).json(),
  )

  expect(answered.question.references).toEqual(expectedReferences)
})
