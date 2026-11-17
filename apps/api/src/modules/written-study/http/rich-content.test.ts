import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  SessionQuestion,
  StudySession,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { richContentNodeFixtures } from '@inzpro/rich-content/fixtures'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { addFixtureAsset } from '~api/test/content-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'
import { addFixtureQuestion } from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

test('a written explanation reads back as rich content, with no address for its image yet', async () => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  const assetId = await addFixtureAsset()

  const content = {
    version: 1,
    doc: {
      type: 'doc',
      content: [
        ...richContentNodeFixtures.heading.doc.content,
        ...richContentNodeFixtures.paragraph.doc.content,
        ...richContentNodeFixtures.bulletList.doc.content,
        ...richContentNodeFixtures.orderedList.doc.content,
        ...richContentNodeFixtures.blockquote.doc.content,
        ...richContentNodeFixtures.table.doc.content,
        { type: 'image', attrs: { assetId, alt: 'Przekrój schodów', caption: null } },
      ],
    },
  } as const

  await addFixtureQuestion(fixture.pathId, fixture.documentId, true, content)
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

  const question = Schema.decodeUnknownSync(SessionQuestion)(
    await (await request(`/sessions/${session.id}/questions/1`)).json(),
  )

  expect(question.explanation).toEqual({ content, assets: [{ id: assetId, url: null }] })
})
