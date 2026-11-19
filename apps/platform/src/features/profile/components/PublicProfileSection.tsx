import { ProfileNotFound } from '@inzpro/api-contracts/modules/profiles/errors'
import { publicProfileQueryOptions } from '@inzpro/queries/modules/profiles/queries'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { Schema } from 'effect'
import { UserRoundX } from 'lucide-react'
import { BackLink } from '~platform/components/BackLink'
import {
  DefaultErrorFallback,
  SuspenseQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { apiHttpClient } from '~platform/lib/api-client'

import { publicProfileRouteApi } from '../utils'
import { PublicProfile } from './PublicProfile'

export const PublicProfileSection = () => {
  const {
    session: { user },
  } = publicProfileRouteApi.useRouteContext()

  const { userId } = publicProfileRouteApi.useParams()

  return (
    <section className="app-layout-section gap-12">
      <BackLink fallback={{ to: '/profil' }} />
      <SuspenseQueryWrapper
        errorFallback={props =>
          Schema.is(ProfileNotFound)(props.error) ? (
            <ProfileUnavailable />
          ) : (
            <DefaultErrorFallback {...props} />
          )
        }
      >
        <SuspenseQuery
          options={publicProfileQueryOptions(apiHttpClient, user.id, { params: { userId } })}
          isDataEmpty={() => false}
        >
          {profile => (
            <PublicProfile
              userId={userId}
              profile={profile}
            />
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

const ProfileUnavailable = () => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia>
        <IconWrapper>
          <UserRoundX />
        </IconWrapper>
      </EmptyMedia>
      <EmptyTitle>Profil jest niedostępny</EmptyTitle>
      <EmptyDescription>Ten profil nie istnieje albo jego właściciel go ukrył.</EmptyDescription>
    </EmptyHeader>
  </Empty>
)
