import { endedStudySession } from '@inzpro/domain/modules/study/study-session'
import { sessionQueryOptions } from '@inzpro/queries/modules/study'
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
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { useEndSession } from '../hooks/useEndSession'
import { sessionQuestionRouteApi } from '../utils'

/** Less prominent session actions, as V1's question header menu. */
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

// An unfinished session can be ended early; an ended one links to its summary instead.
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

// Ends the session early and opens its summary.
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
