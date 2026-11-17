import type { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { optionalCurrentSessionQueryOptions } from '@inzpro/queries/modules/identity/queries'
import { Button } from '@inzpro/ui/components/button'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { apiHttpClient } from '~platform/lib/api-client'

import type { SessionStepValues } from '../validation'
import type { SessionStepSubmit } from './SessionStep'
import { SignInStartButton } from './SignInStartButton'

type PublicStartButtonProps = {
  sessionId: ExamSessionId | undefined
  pending: boolean
  submit: SessionStepSubmit
  onStart: (selection: SessionStepValues, userId: UserId) => Promise<void>
}

export const PublicStartButton: React.FC<PublicStartButtonProps> = ({
  pending,
  sessionId,
  submit,
  onStart,
}) => (
  <SuspenseQueryWrapper
    fallback={
      <Button
        type="submit"
        disabled
      >
        Rozpocznij
      </Button>
    }
  >
    <SuspenseQuery
      options={optionalCurrentSessionQueryOptions(apiHttpClient)}
      isDataEmpty={session => session === null}
      noDataFallback={<SignInStartButton sessionId={sessionId} />}
    >
      {session => (
        <Button
          type="submit"
          disabled={pending}
          onClick={event => {
            event.preventDefault()
            void submit(selection => onStart(selection, session.user.id))
          }}
        >
          Rozpocznij
        </Button>
      )}
    </SuspenseQuery>
  </SuspenseQueryWrapper>
)
