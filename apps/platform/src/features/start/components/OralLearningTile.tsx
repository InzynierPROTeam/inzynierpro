import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { Button } from '@inzpro/ui/components/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@inzpro/ui/components/card'
import { hasExamAccess } from '@inzpro/utils/exam-access'
import { Link } from '@tanstack/react-router'
import { cx } from 'tailwind-variants'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

export const OralLearningTile = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()

  return (
    <Card
      role="region"
      aria-label="Nauka do egzaminu ustnego"
      // Written study and reviews fill the row above it; favourites sit beside it.
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
      <CardContent>
        <p>Przygotuj się do odpowiedzi przed komisją egzaminacyjną.</p>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          nativeButton={false}
          render={<Link to="/ustny" />}
        >
          Zacznij naukę
        </Button>
      </CardFooter>
    </Card>
  )
}
