import { PathResponse } from '@inzpro/api-contracts/modules/preparation/responses'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi, type TestVisitor } from '~api/test/api-server.js'
import {
  learningRequest,
  loginForPreparation,
  technicalConfiguration,
  technicalPathA,
  technicalPathB,
} from '~api/test/preparation.js'

const mazowieckaEngineers = '51000000-0000-4000-8000-000000000007'
const pomorskaEngineers = '51000000-0000-4000-8000-000000000011'
const mazowieckaArchitects = '51000000-0000-4000-8000-000000000023'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const onboardedLearner = async () => {
  const learner = await loginForPreparation(api)
  expect((await learningRequest(api, learner, '/onboarding', technicalConfiguration)).status).toBe(
    200,
  )

  return learner
}

const setChamber = (
  learner: TestVisitor,
  districtChamberId: string | null,
  pathId = technicalPathA,
) => learningRequest(api, learner, `/paths/${pathId}/district-chamber`, { districtChamberId })

const readAssignment = async (learner: TestVisitor) =>
  Schema.decodeUnknownSync(Schema.toCodecJson(PathResponse))(
    await (await learningRequest(api, learner, `/paths/${technicalPathA}`)).json(),
  ).path

test('a new assignment has no district chamber', async () => {
  const learner = await onboardedLearner()

  expect((await readAssignment(learner))?.districtChamber).toBeNull()
})

test('a learner chooses, changes and clears the district chamber of a path', async () => {
  const learner = await onboardedLearner()

  expect((await setChamber(learner, mazowieckaEngineers)).status).toBe(200)
  expect((await readAssignment(learner))?.districtChamber).toEqual({
    id: mazowieckaEngineers,
    code: 'piib-mazowiecka',
    name: 'Mazowiecka Okręgowa Izba Inżynierów Budownictwa',
    shortName: 'Mazowiecka',
  })

  expect((await setChamber(learner, mazowieckaEngineers)).status).toBe(200)
  expect((await setChamber(learner, pomorskaEngineers)).status).toBe(200)
  expect((await readAssignment(learner))?.districtChamber?.id).toBe(pomorskaEngineers)

  expect((await setChamber(learner, null)).status).toBe(200)
  expect((await readAssignment(learner))?.districtChamber).toBeNull()

  const listed = await (await learningRequest(api, learner, '/paths')).json()
  expect(listed).toMatchObject({ data: [{ id: technicalPathA, districtChamber: null }] })
})

test('a district chamber of another general chamber is refused and keeps the previous choice', async () => {
  const learner = await onboardedLearner()
  await setChamber(learner, mazowieckaEngineers)

  const response = await setChamber(learner, mazowieckaArchitects)

  expect(response.status).toBe(400)
  expect(await response.json()).toMatchObject({ type: 'invalid_path_configuration' })
  expect((await readAssignment(learner))?.districtChamber?.id).toBe(mazowieckaEngineers)
})

test('an unknown district chamber is refused', async () => {
  const learner = await onboardedLearner()

  expect((await setChamber(learner, crypto.randomUUID())).status).toBe(400)
})

test('only the owner of an active assignment may set its district chamber', async () => {
  const learner = await onboardedLearner()
  const stranger = await loginForPreparation(api)

  expect((await setChamber(stranger, mazowieckaEngineers)).status).toBe(403)
  expect((await setChamber(learner, mazowieckaEngineers, technicalPathB)).status).toBe(403)

  expect((await learningRequest(api, learner, `/paths/${technicalPathA}/archive`, {})).status).toBe(
    200,
  )
  expect((await setChamber(learner, mazowieckaEngineers)).status).toBe(403)
  expect((await setChamber(learner, null)).status).toBe(403)
  expect((await setChamber(api.visitor(), null)).status).toBe(401)
})
