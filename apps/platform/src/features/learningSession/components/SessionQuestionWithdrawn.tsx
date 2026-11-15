import { Alert, AlertDescription, AlertTitle } from '@inzpro/ui/components/alert'
import { Info } from 'lucide-react'

// A withdrawn question accepts no answer and is skipped without penalty, so the notice informs
// rather than reports an error; the user moves on to the next one (ADR-0003).
export const SessionQuestionWithdrawn = () => (
  <Alert>
    <Info />
    <AlertTitle>To pytanie zostało wycofane</AlertTitle>
    <AlertDescription>
      Nie można już na nie odpowiedzieć i nie liczy się do wyniku sesji.
    </AlertDescription>
  </Alert>
)

// Every question left without an answer was withdrawn, so the session can only end (ADR-0003).
export const RemainingQuestionsWithdrawn = () => (
  <Alert>
    <Info />
    <AlertTitle>Brak kolejnych pytań</AlertTitle>
    <AlertDescription>
      Pozostałe pytania tej sesji zostały wycofane i nie liczą się do wyniku.
    </AlertDescription>
  </Alert>
)
