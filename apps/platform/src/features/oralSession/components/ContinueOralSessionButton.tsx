import type { OralStudySession } from '@inzpro/api-contracts/modules/oral-study/responses'
import { Button } from '@inzpro/ui/components/button'
import { Link } from '@tanstack/react-router'
import type React from 'react'

type ContinueOralSessionButtonProps = {
  session: OralStudySession
  children: React.ReactNode
}

export const ContinueOralSessionButton: React.FC<ContinueOralSessionButtonProps> = ({
  session,
  children,
}) => (
  <Button
    nativeButton={false}
    render={
      <Link
        to="/ustny/sesja/$sessionId/$questionNumber"
        params={{ sessionId: session.id, questionNumber: session.progress.currentQuestion }}
      />
    }
  >
    {children}
  </Button>
)
