import { UserId } from '@inzpro/domain/modules/identity/user'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { expect, test } from 'vitest'
import { oralStudyKeys } from '~queries/modules/oral-study/keys.js'
import { withQueryClient } from '~queries/test/query-client.js'

import { writtenStudyKeys } from './keys.js'

const userId = UserId.make('a0000000-0000-4000-8000-000000000001')
const otherUserId = UserId.make('a0000000-0000-4000-8000-000000000002')
const pathId = QualificationPathId.make('10000000-0000-4000-8000-000000000001')
const otherPathId = QualificationPathId.make('10000000-0000-4000-8000-000000000002')

test('assignment invalidation refreshes both learning kinds for one account and path', () =>
  withQueryClient(async client => {
    const written = writtenStudyKeys.getSessionPreview(userId, {
      params: { qualificationPathId: pathId },
      query: {},
    })

    const oral = oralStudyKeys.getOralSessionPreview(userId, {
      params: { qualificationPathId: pathId },
      query: {},
    })

    const otherAccount = oralStudyKeys.getOralSessionPreview(otherUserId, {
      params: { qualificationPathId: pathId },
      query: {},
    })

    const otherPath = writtenStudyKeys.getSessionPreview(userId, {
      params: { qualificationPathId: otherPathId },
      query: {},
    })

    for (const key of [written, oral, otherAccount, otherPath]) {
      client.setQueryData(key, null)
    }

    await client.invalidateQueries({ queryKey: writtenStudyKeys.path(userId, pathId) })
    expect(client.getQueryState(written)?.isInvalidated).toBe(true)
    expect(client.getQueryState(oral)?.isInvalidated).toBe(false)

    await client.invalidateQueries({ queryKey: oralStudyKeys.path(userId, pathId) })
    expect(client.getQueryState(oral)?.isInvalidated).toBe(true)
    expect(client.getQueryState(otherAccount)?.isInvalidated).toBe(false)
    expect(client.getQueryState(otherPath)?.isInvalidated).toBe(false)
  }))
