import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { FileQuestion } from 'lucide-react'

export const QuestionUnavailable = () => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia>
        <IconWrapper>
          <FileQuestion />
        </IconWrapper>
      </EmptyMedia>
      <EmptyTitle>Pytanie jest niedostępne</EmptyTitle>
      <EmptyDescription>
        To pytanie nie należy do Twojej ścieżki albo zostało wycofane.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
)
