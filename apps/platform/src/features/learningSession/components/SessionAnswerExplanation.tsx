import type { ResolvedRichContent } from '@inzpro/api-contracts/modules/learning-content/responses'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { Item, ItemContent, ItemMedia } from '@inzpro/ui/components/item'
import { RichText } from '@inzpro/ui/components/rich-text'
import { Lightbulb } from 'lucide-react'
import type React from 'react'

type SessionAnswerExplanationProps = { explanation: ResolvedRichContent }

export const SessionAnswerExplanation: React.FC<SessionAnswerExplanationProps> = ({
  explanation,
}) => (
  <Item variant="outline">
    <ItemMedia>
      <IconWrapper size="sm">
        <Lightbulb />
      </IconWrapper>
    </ItemMedia>
    <ItemContent>
      <RichText
        content={explanation.content}
        assets={explanation.assets}
      />
    </ItemContent>
  </Item>
)
