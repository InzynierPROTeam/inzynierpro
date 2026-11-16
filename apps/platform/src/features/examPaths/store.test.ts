import { UserQualificationPath } from '@inzpro/api-contracts/modules/preparation/responses'
// @vitest-environment jsdom
import { getCookie, setCookie, removeCookie } from '@inzpro/browser-utils/cookie'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { Schema } from 'effect'
import { afterEach, describe, expect, it } from 'vitest'

import { createSelectedPathStore, resolveSelectedPath } from './store'

const user = UserId.make('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6a')
const other = UserId.make('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6b')

const first = Schema.decodeSync(UserQualificationPath)({
  id: '0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6c',
  name: 'Test path A',
  specialization: {
    description: null,
    code: 'konstrukcyjno-budowlana',
    id: '60000000-0000-4000-8000-000000000001',
    name: 'Konstrukcyjno-budowlana',
  },
  qualificationKind: {
    code: 'kierowanie',
    id: '70000000-0000-4000-8000-000000000001',
    name: 'Do kierowania robotami budowlanymi',
  },
  qualificationScope: {
    code: 'bez-ograniczen',
    id: '80000000-0000-4000-8000-000000000001',
    name: 'Bez ograniczeń',
  },
  accessScope: 'written',
  archived: false,
  districtChamber: null,
  goal: {
    version: 1,
    examSessionId: '0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6d',
    sessionName: 'Test session',
    sessionIsConfirmed: true,
    writtenAt: '2027-05-01T10:00:00.000Z',
    oralPlanningAt: '2027-05-15T10:00:00.000Z',
    oralExamDate: null,
    accessScope: 'written',
  },
})

const second = {
  ...first,
  id: UserQualificationPath.fields.id.make('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6e'),
  name: 'Test path B',
}

const store = createSelectedPathStore({
  read: getCookie,
  write: setCookie,
  clear: removeCookie,
})

afterEach(() => {
  store.remove(user)
  store.remove(other)
})

describe('client path selection', () => {
  it('uses the saved cookie even when another path is more recent', () => {
    store.set(user, second.id)
    expect(store.synchronize(user, [first, second])).toEqual(second)
    expect(store.get(user)).toBe(second.id)
  })

  it('immediately persists the first active path if the cookie is missing', () => {
    expect(store.synchronize(user, [first, second])).toEqual(first)
    expect(store.get(user)).toBe(first.id)
  })

  it('replaces malformed, foreign and archived selections with the first active path', () => {
    document.cookie = `inzynierpro.selected-path.${user}=invalid; path=/`
    expect(store.synchronize(user, [first])).toEqual(first)
    store.set(user, second.id)
    expect(store.synchronize(user, [{ ...second, archived: true }, first])).toEqual(first)
    expect(store.get(user)).toBe(first.id)
    expect(store.synchronize(user, [second])).toEqual(second)
    expect(store.get(user)).toBe(second.id)
  })

  it('clears the cookie when no active assignments remain', () => {
    store.set(user, first.id)
    expect(store.synchronize(user, [{ ...first, archived: true }])).toBeUndefined()
    expect(store.get(user)).toBeUndefined()
    expect(resolveSelectedPath([], undefined)).toBeUndefined()
  })

  it('isolates account-scoped selections', () => {
    store.set(other, second.id)
    store.set(user, first.id)
    expect(store.get(user)).toBe(first.id)
    expect(store.get(other)).toBe(second.id)
    store.remove(user)
    expect(store.get(other)).toBe(second.id)
  })

  it('keeps separate client storage independent', () => {
    const mobileStorage = new Map<string, string>()

    const mobile = createSelectedPathStore({
      read: key => mobileStorage.get(key),
      write: (key, value) => {
        mobileStorage.set(key, value)
      },
      clear: key => {
        mobileStorage.delete(key)
      },
    })

    store.set(user, first.id)
    mobile.set(user, second.id)
    expect(store.get(user)).toBe(first.id)
    expect(mobile.get(user)).toBe(second.id)
  })
})
