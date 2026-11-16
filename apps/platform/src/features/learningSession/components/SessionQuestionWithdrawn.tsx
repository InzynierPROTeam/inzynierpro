import { Alert, AlertDescription, AlertTitle } from '@inzpro/ui/components/alert'
import { Info } from 'lucide-react'

export const SessionQuestionWithdrawn = () => (
  <Alert>
    <Info />
    <AlertTitle>To pytanie zostało wycofane</AlertTitle>
    <AlertDescription>
      Nie można już na nie odpowiedzieć i nie liczy się do wyniku sesji.
    </AlertDescription>
  </Alert>
)

export const RemainingQuestionsWithdrawn = () => (
  <Alert>
    <Info />
    <AlertTitle>Brak kolejnych pytań</AlertTitle>
    <AlertDescription>
      Pozostałe pytania tej sesji zostały wycofane i nie liczą się do wyniku.
    </AlertDescription>
  </Alert>
)
