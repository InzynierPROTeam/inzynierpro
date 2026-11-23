import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  SessionQuestion,
  StudySession,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { richContentNodeFixtures } from '@inzpro/rich-content/fixtures'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import { addFixtureAsset, fixtureAssetBytes } from '~api/test/content-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'
import { addFixtureQuestion } from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

test('a written explanation reads back with a signed image address that a learner outside the path never receives', async () => {
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

  expect(question.explanation.content).toEqual(content)
  expect(question.explanation.assets).toEqual([{ id: assetId, url: expect.any(String) }])

  const url = new URL(question.explanation.assets[0]?.url ?? '')
  const image = await fetch(url)

  expect(url.searchParams.get('X-Amz-Expires')).toBe('3600')
  expect(image.status).toBe(200)
  expect(new Uint8Array(await image.arrayBuffer())).toEqual(fixtureAssetBytes)

  const outsider = await loginForPreparation(api)

  const outsiderRead = await learningRequest(
    api,
    outsider,
    `/paths/${fixture.pathId}/sessions/${session.id}/questions/1`,
  )

  expect(outsiderRead.status).toBe(403)
  expect(await outsiderRead.text()).not.toContain(assetId)
})
