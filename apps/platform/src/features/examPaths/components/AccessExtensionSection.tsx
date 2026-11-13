import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { Button } from '@inzpro/ui/components/button'
import {
  SectionHeader,
  SectionHeaderContent,
  SectionHeaderTitle,
} from '@inzpro/ui/components/section-header'
import { Link, useRouter } from '@tanstack/react-router'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { accessExtensionRouteApi, getAccessReturnPath } from '../utils'
import { AccessExtension } from './AccessExtension'

export const AccessExtensionSection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { egzamin, redirect } = accessExtensionRouteApi.useSearch()
  const router = useRouter()

  return (
    <section className="app-layout-section gap-12">
      <SectionHeader>
        <SectionHeaderContent>
          <SectionHeaderTitle render={<h1 />}>
            {egzamin === writtenExamAccess
              ? 'Dostęp do egzaminu pisemnego'
              : 'Dostęp do egzaminu ustnego'}
          </SectionHeaderTitle>
        </SectionHeaderContent>
      </SectionHeader>
      <AccessExtension
        pathId={selectedPath.id}
        userId={user.id}
        onExtended={() => router.navigate({ to: getAccessReturnPath(redirect, egzamin) })}
      />
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link to="/start" />}
        className="self-start"
      >
        Wróć na start
      </Button>
    </section>
  )
}
