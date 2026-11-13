import type { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { Button } from '@inzpro/ui/components/button'
import { Link, useRouter } from '@tanstack/react-router'
import type React from 'react'
import { onboardingSignInIntent } from '~platform/features/auth/config'

import { publicOnboardingRouteApi } from '../utils/route-api'

type SignInStartButtonProps = { sessionId: ExamSessionId | undefined }

export const SignInStartButton: React.FC<SignInStartButtonProps> = ({ sessionId }) => {
  const draft = publicOnboardingRouteApi.useSearch()
  const router = useRouter()

  const redirect = router.buildLocation({
    to: '/zacznij',
    search: { ...draft, sesja: sessionId },
  }).href

  return (
    <Button
      nativeButton={false}
      render={
        <Link
          to="/logowanie"
          search={{ redirect, intent: onboardingSignInIntent }}
        />
      }
    >
      Zaloguj się
    </Button>
  )
}
