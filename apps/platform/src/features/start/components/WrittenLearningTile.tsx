import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { Button } from '@inzpro/ui/components/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@inzpro/ui/components/card'
import { Link } from '@tanstack/react-router'
import { cx } from 'tailwind-variants'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

export const WrittenLearningTile = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()

  return (
    <Card
      className={cx(
        selectedPath.accessScope === writtenExamAccess
          ? 'col-span-full'
          : 'col-span-8 @max-3xl:col-span-full',
      )}
    >
      <CardHeader>
        <CardTitle>
          <h2>Nauka do egzaminu pisemnego</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>Czas rozpocząć naukę do egzaminu pisemnego!</p>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          nativeButton={false}
          render={<Link to="/nauka/start" />}
        >
          Zacznij naukę
        </Button>
      </CardFooter>
    </Card>
  )
}
