import type { StudySessionId } from '@inzpro/domain/modules/learning/study-session'
import { Button } from '@inzpro/ui/components/button'
import { Link } from '@tanstack/react-router'
import type React from 'react'

type SessionSummaryLinkProps = { sessionId: StudySessionId }

export const SessionSummaryLink: React.FC<SessionSummaryLinkProps> = ({ sessionId }) => (
  <Button
    variant="link"
    size="empty"
    nativeButton={false}
    render={
      <Link
        to="/nauka/sesja/$sessionId/podsumowanie"
        params={{ sessionId }}
      />
    }
  >
    Zobacz podsumowanie
  </Button>
)
