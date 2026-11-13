import type {
  ReferenceDocumentId,
  QuestionCount,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { Button } from '@inzpro/ui/components/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@inzpro/ui/components/card'
import { Link } from '@tanstack/react-router'
import type React from 'react'

type CategorySessionCardProps = {
  categoryId: ReferenceDocumentId
  availableQuestionCount: QuestionCount
}

export const CategorySessionCard: React.FC<CategorySessionCardProps> = ({
  categoryId,
  availableQuestionCount,
}) => (
  <Card className="flex-1">
    <CardHeader>
      <CardTitle>
        <h2>Sesja nauki</h2>
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-2">
      {/* TODO: Read the current/latest session when the study-session backend is implemented. */}
      <h3 className="font-semibold">Rozpocznij pierwszą sesję</h3>
      <p className="text-muted-foreground text-sm">
        {availableQuestionCount === 0
          ? 'Pytania dla tej kategorii nie są jeszcze dostępne.'
          : 'Przejdź do szczegółów sesji, aby przygotować się do nauki z tej kategorii.'}
      </p>
    </CardContent>
    <CardFooter className="mt-auto">
      <Button
        nativeButton={false}
        disabled={availableQuestionCount === 0}
        render={
          <Link
            to="/nauka/start"
            search={{ 'akt-prawny': categoryId }}
          />
        }
      >
        Zacznij naukę
      </Button>
    </CardFooter>
  </Card>
)
