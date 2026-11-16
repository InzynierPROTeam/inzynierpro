import { CurrentSessionResponse } from '@inzpro/api-contracts/modules/identity/responses'
import type { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { Schema } from 'effect'
import type { TestApi, TestVisitor } from '~api/test/api-server.js'

export const technicalPathA = '10000000-0000-4000-8000-000000000001'
export const technicalPathB = '10000000-0000-4000-8000-000000000002'
export const technicalDocumentA = '20000000-0000-4000-8000-000000000001'
export const technicalDocumentB = '20000000-0000-4000-8000-000000000002'

export const technicalConfiguration = {
  specializationId: '60000000-0000-4000-8000-000000000001',
  qualificationKindId: '70000000-0000-4000-8000-000000000001',
  qualificationScopeId: '80000000-0000-4000-8000-000000000001',
  accessScope: 'both',
  examSessionId: '90000000-0000-4000-8000-000000000001',
  oralExamDate: null,
} satisfies typeof CompleteOnboardingPayload.Encoded

export const loginForPreparation = async (api: TestApi) => {
  const visitor = api.visitor()
  const email = `preparation-${crypto.randomUUID()}@example.com`
  await visitor.sendCode(email)
  await visitor.signIn(email, api.lastCodeFor(email))

  const { user } = Schema.decodeUnknownSync(CurrentSessionResponse)(
    await (await visitor.session()).json(),
  )

  return { ...visitor, userId: user.id }
}

export const learningRequest = <Body>(
  api: TestApi,
  visitor: TestVisitor,
  path: string,
  body?: Body,
) =>
  visitor.jar.fetch(
    new URL(
      `/api/v1/${/\/(documents|oral|preview|sessions|latest-session|review-preview|review-session|review-sessions|favorites|favorites-preview|favorites-session|favorites-sessions)(\/|\?|$)/.test(path) ? 'study' : 'preparation'}${path}`,
      api.baseUrl,
    ),
    body === undefined
      ? undefined
      : {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
  )
