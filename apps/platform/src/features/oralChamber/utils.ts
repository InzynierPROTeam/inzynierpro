import type { UserQualificationPath } from '@inzpro/api-contracts/modules/preparation/responses'
import {
  type OralQuestionScope,
  pathOralQuestionScope,
  reportedInMyChamberOralQuestionScope,
} from '@inzpro/domain/modules/oral-study/oral-study-session'
import { getCookie, setCookie } from '@inzpro/react-utils/tanstack-start/cookies'
import { Duration } from 'effect'

import { createOralChamberFilterStore } from './stores'

export const oralChamberFilterStore = createOralChamberFilterStore({
  read: getCookie,
  write: (name, value) => setCookie(name, value, { maxAge: Duration.days(365) }),
})

export const getOralQuestionScope = (
  path: Pick<UserQualificationPath, 'districtChamber'>,
  isChamberFilterOn: boolean,
): OralQuestionScope =>
  isChamberFilterOn && path.districtChamber !== null
    ? reportedInMyChamberOralQuestionScope
    : pathOralQuestionScope
