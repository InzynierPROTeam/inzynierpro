import { ProfileNotFound } from '@inzpro/api-contracts/modules/profiles/errors'
import {
  PublicProfileParams,
  type RenameProfilePayload,
  type SetProfilePrivacyPayload,
} from '@inzpro/api-contracts/modules/profiles/requests'
import type { ProfileSettings } from '@inzpro/api-contracts/modules/profiles/responses'
import { withHttpServer } from '@inzpro/testing/http'
import { Effect, Schema } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { runApi } from '~api-client/lib/run-api.js'
import {
  getProfileSettings,
  getPublicProfile,
  renameProfile,
  setProfilePrivacy,
} from '~api-client/modules/profiles.js'

const userId = Schema.decodeSync(PublicProfileParams.fields.userId)(
  '0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6a',
)

const publicProfile = {
  name: 'Anna Nowak',
  image: null,
  totalXp: 120,
  badges: [{ code: 'streak_7' }],
  currentStreak: 4,
  paths: [
    {
      specialization: {
        id: '60000000-0000-4000-8000-000000000002',
        name: 'Konstrukcyjno-budowlana',
      },
      qualificationKind: {
        id: '70000000-0000-4000-8000-000000000002',
        name: 'Do kierowania robotami budowlanymi',
      },
      qualificationScope: {
        id: '80000000-0000-4000-8000-000000000002',
        name: 'Bez ograniczeń',
      },
      examSession: {
        id: '90000000-0000-4000-8000-000000000002',
        name: 'Sesja jesienna 2026',
        writtenAt: '2026-11-27T08:00:00.000Z',
      },
    },
  ],
}

const respondTo = (
  expectedBody: typeof RenameProfilePayload.Encoded | typeof SetProfilePrivacyPayload.Encoded,
  settings: typeof ProfileSettings.Encoded,
) =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest
    expect(yield* request.json.pipe(Effect.orDie)).toEqual(expectedBody)

    return HttpServerResponse.jsonUnsafe(settings)
  })

test('the profile settings are read from the shared contract', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        '/api/v1/profile',
        HttpServerResponse.jsonUnsafe({ name: 'Anna Nowak', privateProfile: false }),
      ),
    ],
    async ({ httpClient }) => {
      expect(await runApi(getProfileSettings(), httpClient)).toEqual({
        name: 'Anna Nowak',
        privateProfile: false,
      })
    },
  ))

test('renaming sends the new name', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'PUT',
        '/api/v1/profile/name',
        respondTo({ name: 'Jan Kowalski' }, { name: 'Jan Kowalski', privateProfile: false }),
      ),
    ],
    async ({ httpClient }) => {
      expect(
        await runApi(
          renameProfile({
            payload: { name: 'Jan Kowalski' },
          }),
          httpClient,
        ),
      ).toEqual({ name: 'Jan Kowalski', privateProfile: false })
    },
  ))

test('changing privacy sends the chosen visibility', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'PUT',
        '/api/v1/profile/privacy',
        respondTo({ privateProfile: true }, { name: 'Anna Nowak', privateProfile: true }),
      ),
    ],
    async ({ httpClient }) => {
      expect(
        await runApi(setProfilePrivacy({ payload: { privateProfile: true } }), httpClient),
      ).toEqual({ name: 'Anna Nowak', privateProfile: true })
    },
  ))

test('a public profile is read by user ID', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        `/api/v1/users/${userId}/profile`,
        HttpServerResponse.jsonUnsafe(publicProfile),
      ),
    ],
    async ({ httpClient }) => {
      expect(await runApi(getPublicProfile({ params: { userId } }), httpClient)).toEqual(
        publicProfile,
      )
    },
  ))

test('a hidden profile fails with ProfileNotFound', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        `/api/v1/users/${userId}/profile`,
        HttpServerResponse.jsonUnsafe(
          Schema.encodeSync(ProfileNotFound)(
            new ProfileNotFound({
              type: 'profile_not_found',
              message: 'The profile was not found.',
            }),
          ),
          { status: 404 },
        ),
      ),
    ],
    async ({ httpClient }) => {
      await expect(
        runApi(getPublicProfile({ params: { userId } }), httpClient),
      ).rejects.toBeInstanceOf(ProfileNotFound)
    },
  ))
