import { PageLimit } from '@inzpro/domain/common/pagination'
import { maxUserQualificationPaths } from '@inzpro/domain/modules/preparation/config'
import { pathsQueryOptions } from '@inzpro/queries/modules/preparation'
import { Skeleton } from '@inzpro/ui/components/skeleton'
import { Link } from '@tanstack/react-router'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { authenticatedRouteApi } from '~platform/features/auth/utils'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

export const SidebarSpecialty = () => {
  const specialtyName = onboardedRouteApi.useMatch({
    shouldThrow: false,
    select: match => match.context.selectedPath?.specialization.name,
  })

  return (
    <div className="flex flex-col">
      <p className="text-foreground/50 text-xs">Twoja specjalność:</p>
      {specialtyName === undefined ? (
        <OptionalSpecialty />
      ) : (
        <p className="line-clamp-2 leading-tight font-semibold">{specialtyName}</p>
      )}
    </div>
  )
}

const SelectSpecialty = () => (
  <Link
    to="/pierwsze-kroki"
    className="underline underline-offset-2"
  >
    <span className="line-clamp-2 font-semibold">Wybierz specjalność</span>
  </Link>
)

const OptionalSpecialty = () => {
  const {
    session: { user },
    selectedPathId,
  } = authenticatedRouteApi.useRouteContext()

  if (selectedPathId === undefined) {
    return <SelectSpecialty />
  }

  return (
    <SuspenseQueryWrapper
      fallback={<Skeleton className="h-7" />}
      errorFallback={() => (
        <p className="text-destructive line-clamp-2 font-semibold">Wystąpił błąd</p>
      )}
    >
      <SuspenseQuery
        options={pathsQueryOptions(apiHttpClient, user.id, {
          query: { limit: PageLimit.make(maxUserQualificationPaths) },
        })}
        isDataEmpty={() => false}
      >
        {response => {
          const path = response.data.find(path => !path.archived && path.id === selectedPathId)

          return path === undefined ? (
            <SelectSpecialty />
          ) : (
            <p className="line-clamp-2 leading-tight font-semibold">{path.specialization.name}</p>
          )
        }}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}
