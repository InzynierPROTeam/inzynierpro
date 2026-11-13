import { writtenExamAccess, type ExamPart } from '@inzpro/domain/modules/preparation/exam-access'
import { getCookie, setCookie, removeCookie } from '@inzpro/react-utils/tanstack-start/cookies'
import { getRouteApi } from '@tanstack/react-router'
import { Duration } from 'effect'
import { safeRedirectPath } from '~platform/utils/redirect'

import { createSelectedPathStore } from './store'

export const selectedPathStore = createSelectedPathStore({
  read: getCookie,
  write: (name, value) => setCookie(name, value, { maxAge: Duration.days(365) }),
  clear: removeCookie,
})

export const accessExtensionRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/rozszerz-dostep',
)

export const getAccessReturnPath = (value: string | undefined, part: ExamPart) => {
  const target = safeRedirectPath(value)

  return value === undefined || target.startsWith('/rozszerz-dostep')
    ? part === writtenExamAccess
      ? '/nauka'
      : '/ustny'
    : target
}
