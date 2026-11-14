import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { useId } from 'react'
import { cx } from 'tailwind-variants'
import { LatestSessionContent } from '~platform/features/learningSession/components/LatestSessionContent'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

export const WrittenLearningTile = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()
  const titleId = useId()

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      className={cx(
        selectedPath.accessScope === writtenExamAccess
          ? 'col-span-full'
          : 'col-span-8 @max-3xl:col-span-full',
      )}
    >
      <CardHeader>
        <CardTitle>
          <h2 id={titleId}>Nauka do egzaminu pisemnego</h2>
        </CardTitle>
      </CardHeader>
      <LatestSessionContent />
    </Card>
  )
}
