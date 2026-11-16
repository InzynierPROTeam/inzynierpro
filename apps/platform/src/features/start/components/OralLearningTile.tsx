import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { hasExamAccess } from '@inzpro/utils/exam-access'
import { cx } from 'tailwind-variants'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { LatestOralSessionContent } from '~platform/features/oralSession/components/LatestOralSessionContent'

export const OralLearningTile = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()

  return (
    <Card
      role="region"
      aria-label="Nauka do egzaminu ustnego"
      className={cx(
        '@max-3xl:col-span-full',
        hasExamAccess(selectedPath.accessScope, writtenExamAccess) ? 'col-span-8' : 'col-span-full',
      )}
    >
      <CardHeader>
        <CardTitle>
          <h2>Nauka do egzaminu ustnego</h2>
        </CardTitle>
      </CardHeader>
      <LatestOralSessionContent />
    </Card>
  )
}
