import { Alert, AlertTitle } from '@inzpro/ui/components/alert'
import { CircleAlert } from 'lucide-react'

// A withdrawn question accepts no answer; the user moves on to the next one (ADR-0003).
export const SessionQuestionWithdrawn = () => (
  <Alert variant="destructive">
    <CircleAlert />
    <AlertTitle>To pytanie zostało wycofane</AlertTitle>
  </Alert>
)
