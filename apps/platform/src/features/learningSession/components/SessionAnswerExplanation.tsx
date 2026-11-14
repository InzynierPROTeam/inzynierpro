import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { Item, ItemContent, ItemMedia } from '@inzpro/ui/components/item'
import { Lightbulb } from 'lucide-react'
import type React from 'react'

type SessionAnswerExplanationProps = { explanation: string }

export const SessionAnswerExplanation: React.FC<SessionAnswerExplanationProps> = ({
  explanation,
}) => (
  <Item variant="outline">
    <ItemMedia>
      <IconWrapper size="sm">
        <Lightbulb />
      </IconWrapper>
    </ItemMedia>
    <ItemContent className="leading-relaxed whitespace-pre-line">{explanation}</ItemContent>
  </Item>
)
