import { Button } from '@inzpro/ui/components/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@inzpro/ui/components/card'
import { Link } from '@tanstack/react-router'
import { useId } from 'react'

export const OralLearningTile = () => {
  const titleId = useId()

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      // Written study and reviews fill the row above it.
      className="col-span-full"
    >
      <CardHeader>
        <CardTitle>
          <h2 id={titleId}>Nauka do egzaminu ustnego</h2>
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
