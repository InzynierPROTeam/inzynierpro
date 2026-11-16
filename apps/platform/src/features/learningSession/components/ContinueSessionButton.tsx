import type { StudySession } from '@inzpro/api-contracts/modules/study/responses'
import { Button } from '@inzpro/ui/components/button'
import { Link } from '@tanstack/react-router'
import type React from 'react'

type ContinueSessionButtonProps = {
  session: StudySession
  children: React.ReactNode
}

export const ContinueSessionButton: React.FC<ContinueSessionButtonProps> = ({
  session,
  children,
}) => (
  <Button
    nativeButton={false}
    render={
      <Link
        to="/nauka/sesja/$sessionId/$questionNumber"
        params={{ sessionId: session.id, questionNumber: session.progress.currentQuestion }}
      />
    }
  >
    {children}
  </Button>
)
