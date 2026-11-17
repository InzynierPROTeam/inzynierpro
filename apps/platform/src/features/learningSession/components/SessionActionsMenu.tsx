import { endedStudySession } from '@inzpro/domain/modules/learning/study-session'
import { sessionQueryOptions } from '@inzpro/queries/modules/written-study/queries'
import { Button } from '@inzpro/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@inzpro/ui/components/dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LoaderCircle, MoreVertical } from 'lucide-react'
import { sessionQuestionRouteApi } from '~platform/features/learningSession/utils/session'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { useEndSession } from '../hooks/useEndSession'

export const SessionActionsMenu = () => (
  <DropdownMenu>
    <DropdownMenuTrigger
      render={
        <Button
          variant="outline"
          size="icon-md"
          aria-label="Opcje sesji"
        />
      }
    >
      <MoreVertical />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <SessionMenuItem />
    </DropdownMenuContent>
  </DropdownMenu>
)

const SessionMenuItem = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId } = sessionQuestionRouteApi.useParams()

  const { data: session } = useQuery(
    sessionQueryOptions(apiHttpClient, user.id, {
      params: { qualificationPathId: selectedPath.id, sessionId },
    }),
  )

  if (session?.status === endedStudySession) {
    return (
      <DropdownMenuItem
        render={
          <Link
            to="/nauka/sesja/$sessionId/podsumowanie"
            params={{ sessionId }}
          />
        }
      >
        Zobacz podsumowanie
      </DropdownMenuItem>
    )
  }

  return <EndSessionMenuItem />
}

const EndSessionMenuItem = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId } = sessionQuestionRouteApi.useParams()
  const mutation = useEndSession(user.id)

  return (
    <DropdownMenuItem
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate({ params: { qualificationPathId: selectedPath.id, sessionId } })
      }
    >
      {mutation.isPending && <LoaderCircle className="animate-spin" />}
      Zakończ sesję
    </DropdownMenuItem>
  )
}
