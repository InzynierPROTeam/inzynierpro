// @vitest-environment jsdom
import { getCookie, removeCookie, setCookie } from '@inzpro/browser-utils/cookie'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createOralChamberFilterStore,
  ORAL_CHAMBER_FILTER_EVENT_NAME,
} from '~platform/features/oralChamber/stores'

const path = QualificationPathId.make('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6c')
const other = QualificationPathId.make('0190f6a2-9c1d-7c3e-8a4b-1f2e3d4c5b6e')

const store = createOralChamberFilterStore({ read: getCookie, write: setCookie })

afterEach(() => {
  removeCookie(`inzynierpro.oral-chamber-filter.${path}`)
  removeCookie(`inzynierpro.oral-chamber-filter.${other}`)
})

describe('oral chamber filter store', () => {
  it('is off until the learner turns it on', () => {
    expect(store.get(path)).toBe(false)

    store.set(path, true)

    expect(store.get(path)).toBe(true)

    store.set(path, false)

    expect(store.get(path)).toBe(false)
  })

  it('remembers the filter per path', () => {
    store.set(path, true)

    expect(store.get(other)).toBe(false)

    store.set(other, true)
    store.set(path, false)

    expect(store.get(other)).toBe(true)
  })

  it('treats a malformed cookie as off', () => {
    document.cookie = `inzynierpro.oral-chamber-filter.${path}=yes; path=/`

    expect(store.get(path)).toBe(false)
  })

  it('notifies subscribers when the filter changes', () => {
    let notified = 0
    const notify = () => notified++
    window.addEventListener(ORAL_CHAMBER_FILTER_EVENT_NAME, notify)

    store.set(path, true)

    window.removeEventListener(ORAL_CHAMBER_FILTER_EVENT_NAME, notify)

    expect(notified).toBe(1)
  })
})
