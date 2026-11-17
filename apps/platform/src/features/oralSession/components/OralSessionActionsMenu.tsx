import { endedStudySession } from '@inzpro/domain/modules/learning/study-session'
import { oralSessionQueryOptions } from '@inzpro/queries/modules/oral-study/queries'
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

import { useEndOralSession } from '../hooks/useEndOralSession'
import { oralSessionQuestionRouteApi } from '../utils'

export const OralSessionActionsMenu = () => (
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
      <OralSessionMenuItem />
    </DropdownMenuContent>
  </DropdownMenu>
)

const OralSessionMenuItem = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId } = oralSessionQuestionRouteApi.useParams()

  const { data: session } = useQuery(
    oralSessionQueryOptions(apiHttpClient, user.id, {
      params: { qualificationPathId: selectedPath.id, sessionId },
    }),
  )

  if (session?.status === endedStudySession) {
    return (
      <DropdownMenuItem
        render={
          <Link
            to="/ustny/sesja/$sessionId/podsumowanie"
            params={{ sessionId }}
          />
        }
      >
        Zobacz podsumowanie
      </DropdownMenuItem>
    )
  }

  return <EndOralSessionMenuItem />
}

const EndOralSessionMenuItem = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId } = oralSessionQuestionRouteApi.useParams()
  const mutation = useEndOralSession(user.id)

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
