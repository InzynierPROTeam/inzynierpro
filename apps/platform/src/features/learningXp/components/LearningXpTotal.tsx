import { learningXpQueryOptions } from '@inzpro/queries/modules/learning-xp/queries'
import { useQuery } from '@tanstack/react-query'
import { authenticatedRouteApi } from '~platform/features/auth/utils'
import { apiHttpClient } from '~platform/lib/api-client'

export const LearningXpTotal = () => {
  const {
    session: { user },
  } = authenticatedRouteApi.useRouteContext()

  const { data } = useQuery(learningXpQueryOptions(apiHttpClient, user.id))

  return data === undefined ? null : (
    <span
      className="text-muted-foreground text-sm whitespace-nowrap"
      aria-label={`Punkty za naukę: ${data.total} XP`}
    >
      {data.total} XP
    </span>
  )
}
