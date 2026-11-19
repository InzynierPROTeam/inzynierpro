import { UserId } from '@inzpro/domain/modules/identity/user'
import { withHttpServer } from '@inzpro/testing/http'
import { Schema } from 'effect'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { profileKeys } from '~queries/modules/profiles/keys.js'
import {
  profileSettingsQueryOptions,
  publicProfileQueryOptions,
} from '~queries/modules/profiles/queries.js'
import { withQueryClient } from '~queries/test/query-client.js'

const viewerId = Schema.decodeSync(UserId)('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6a')
const ownerId = Schema.decodeSync(UserId)('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6b')

const settings = { name: 'Jan Kowalski', privateProfile: false }

const publicProfile = {
  name: 'Anna Nowak',
  image: null,
  totalXp: 120,
  badges: [],
  currentStreak: 4,
  paths: [],
}

test('profile reads are cached per viewing account and refreshed through the account group', () =>
  withHttpServer(
    [
      HttpRouter.route('GET', '/api/v1/profile', HttpServerResponse.jsonUnsafe(settings)),
      HttpRouter.route(
        'GET',
        `/api/v1/users/${ownerId}/profile`,
        HttpServerResponse.jsonUnsafe(publicProfile),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async queryClient => {
        const settingsOptions = profileSettingsQueryOptions(httpClient, viewerId)

        const publicOptions = publicProfileQueryOptions(httpClient, viewerId, {
          params: { userId: ownerId },
        })

        expect(settingsOptions.queryKey).toEqual([
          'profiles',
          'account',
          viewerId,
          'getProfileSettings',
          {},
        ])
        expect(publicOptions.queryKey).toEqual([
          'profiles',
          'account',
          viewerId,
          'getPublicProfile',
          { params: { userId: ownerId } },
        ])
        expect(await queryClient.query(settingsOptions)).toEqual(settings)
        expect(await queryClient.query(publicOptions)).toEqual(publicProfile)

        await queryClient.invalidateQueries({ queryKey: profileKeys.account(viewerId) })

        expect(queryClient.getQueryState(settingsOptions.queryKey)?.isInvalidated).toBe(true)
        expect(queryClient.getQueryState(publicOptions.queryKey)?.isInvalidated).toBe(true)
      }),
  ))
