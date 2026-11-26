import { appNameKebabCase } from '@inzpro/config/app'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'

const chamberFilterKey = (pathId: QualificationPathId) =>
  `${appNameKebabCase}.oral-chamber-filter.${pathId}`

export const ORAL_CHAMBER_FILTER_EVENT_NAME = 'oral_chamber_filter_update'

type ChamberFilterCookies = {
  read: (name: string) => string | null | undefined
  write: (name: string, value: string) => void
}

export const createOralChamberFilterStore = (cookies: ChamberFilterCookies) => ({
  get: (pathId: QualificationPathId) => cookies.read(chamberFilterKey(pathId)) === 'true',
  set: (pathId: QualificationPathId, enabled: boolean) => {
    cookies.write(chamberFilterKey(pathId), String(enabled))
    window.dispatchEvent(new Event(ORAL_CHAMBER_FILTER_EVENT_NAME))
  },
})
