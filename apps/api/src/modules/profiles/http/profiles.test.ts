import { CurrentSessionResponse } from '@inzpro/api-contracts/modules/identity/responses'
import { LearningXpResponse } from '@inzpro/api-contracts/modules/learning-xp/responses'
import { PathMutationResponse } from '@inzpro/api-contracts/modules/preparation/responses'
import { ProfileNotFound } from '@inzpro/api-contracts/modules/profiles/errors'
import type {
  RenameProfilePayload,
  SetProfilePrivacyPayload,
} from '@inzpro/api-contracts/modules/profiles/requests'
import { ProfileSettings, PublicProfile } from '@inzpro/api-contracts/modules/profiles/responses'
import { Streak } from '@inzpro/api-contracts/modules/streak/responses'
import { InvalidRequest } from '@inzpro/api-contracts/utils/api-error'
import { profileNameMaxLength } from '@inzpro/domain/modules/profiles/profile'
import { Schema } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { startTestApi, type TestApi, type TestVisitor } from '~api/test/api-server.js'
import {
  learningRequest,
  loginForPreparation,
  smallPathConfiguration,
  technicalConfiguration,
} from '~api/test/preparation.js'

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

const failure =
  <T, E>(schema: Schema.Codec<T, E>, status: number) =>
  async (response: Response) => {
    expect(response.status, await response.clone().text()).toBe(status)

    return Schema.decodeUnknownSync(schema)(await response.json())
  }

const get = (visitor: TestVisitor, path: string) =>
  visitor.jar.fetch(new URL(`/api/v1${path}`, api.baseUrl))

const put = (
  visitor: TestVisitor,
  path: string,
  body: typeof RenameProfilePayload.Encoded | typeof SetProfilePrivacyPayload.Encoded,
) =>
  visitor.jar.fetch(new URL(`/api/v1${path}`, api.baseUrl), {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

const rename = (visitor: TestVisitor, name: string) => put(visitor, '/profile/name', { name })

const setPrivacy = (visitor: TestVisitor, privateProfile: boolean) =>
  put(visitor, '/profile/privacy', { privateProfile })

const publicProfileOf = (visitor: TestVisitor, userId: string) =>
  get(visitor, `/users/${userId}/profile`)

const sessionNameOf = async (visitor: TestVisitor) =>
  (await decode(CurrentSessionResponse)(await visitor.session())).user.name

test('renaming trims the name and refreshes the signed-in session', async () => {
  const visitor = await loginForPreparation(api)

  expect(await decode(ProfileSettings)(await rename(visitor, '  Jan Kowalski  '))).toEqual({
    name: 'Jan Kowalski',
    privateProfile: false,
  })
  expect(await sessionNameOf(visitor)).toBe('Jan Kowalski')
  expect(await decode(ProfileSettings)(await get(visitor, '/profile'))).toEqual({
    name: 'Jan Kowalski',
    privateProfile: false,
  })
})

test('a name of the maximum length after trimming is accepted', async () => {
  const visitor = await loginForPreparation(api)
  const name = 'a'.repeat(profileNameMaxLength)

  expect((await decode(ProfileSettings)(await rename(visitor, ` ${name} `))).name).toBe(name)
})

test.each([
  ['an empty name', ''],
  ['a name of whitespace only', '   '],
  ['a name over the maximum length', 'a'.repeat(profileNameMaxLength + 1)],
])('renaming rejects %s and keeps the previous name', async (_, name) => {
  const visitor = await loginForPreparation(api)
  const previous = await sessionNameOf(visitor)

  expect(await failure(InvalidRequest, 400)(await rename(visitor, name))).toBeInstanceOf(
    InvalidRequest,
  )
  expect(await sessionNameOf(visitor)).toBe(previous)
})

test('the authentication update-user route cannot bypass name validation', async () => {
  const visitor = await loginForPreparation(api)
  const previous = await sessionNameOf(visitor)

  const response = await visitor.jar.fetch(new URL('/api/v1/auth/update-user', api.baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: '' }),
  })

  expect(response.status).toBe(404)
  expect(await sessionNameOf(visitor)).toBe(previous)
})

test('the public profile exposes exactly the public fields and active paths', async () => {
  const owner = await loginForPreparation(api)
  const viewer = await loginForPreparation(api)

  await decode(PathMutationResponse)(
    await learningRequest(api, owner, '/onboarding', smallPathConfiguration),
  )

  const archived = await decode(PathMutationResponse)(
    await learningRequest(api, owner, '/onboarding', technicalConfiguration),
  )

  await decode(PathMutationResponse)(
    await learningRequest(api, owner, `/paths/${archived.qualificationPathId}/archive`, {}),
  )
  await decode(ProfileSettings)(await rename(owner, 'Anna Nowak'))

  const response = await publicProfileOf(viewer, owner.userId)

  expect(response.status).toBe(200)

  const profile = Schema.decodeUnknownSync(PublicProfile)(await response.json(), {
    onExcessProperty: 'error',
  })

  const learningXp = await decode(LearningXpResponse)(await get(owner, '/learning-xp'))
  const streak = await decode(Streak)(await get(owner, '/streak'))

  expect(profile).toMatchObject({
    name: 'Anna Nowak',
    image: null,
    totalXp: learningXp.total,
    badges: learningXp.badges.map(badge => ({ code: badge.code })),
    currentStreak: streak.currentStreak,
  })
  expect(
    profile.paths.map(path => ({
      specializationId: path.specialization.id,
      qualificationKindId: path.qualificationKind.id,
      qualificationScopeId: path.qualificationScope.id,
      examSessionId: path.examSession.id,
    })),
  ).toEqual([
    {
      specializationId: smallPathConfiguration.specializationId,
      qualificationKindId: smallPathConfiguration.qualificationKindId,
      qualificationScopeId: smallPathConfiguration.qualificationScopeId,
      examSessionId: smallPathConfiguration.examSessionId,
    },
  ])
})

test('a private profile is not found for others but stays visible to its owner', async () => {
  const owner = await loginForPreparation(api)
  const viewer = await loginForPreparation(api)

  expect((await decode(ProfileSettings)(await get(owner, '/profile'))).privateProfile).toBe(false)
  expect(await decode(ProfileSettings)(await setPrivacy(owner, true))).toMatchObject({
    privateProfile: true,
  })

  expect(
    await failure(ProfileNotFound, 404)(await publicProfileOf(viewer, owner.userId)),
  ).toBeInstanceOf(ProfileNotFound)
  expect((await publicProfileOf(owner, owner.userId)).status).toBe(200)

  await decode(ProfileSettings)(await setPrivacy(owner, false))

  expect((await publicProfileOf(viewer, owner.userId)).status).toBe(200)
})

test('a missing user has no public profile', async () => {
  const viewer = await loginForPreparation(api)

  expect(
    await failure(ProfileNotFound, 404)(await publicProfileOf(viewer, crypto.randomUUID())),
  ).toBeInstanceOf(ProfileNotFound)
})

test('profiles require a signed-in user', async () => {
  const visitor = api.visitor()
  const owner = await loginForPreparation(api)

  expect((await publicProfileOf(visitor, owner.userId)).status).toBe(401)
  expect((await get(visitor, '/profile')).status).toBe(401)
  expect((await rename(visitor, 'Jan')).status).toBe(401)
  expect((await setPrivacy(visitor, true)).status).toBe(401)
})
