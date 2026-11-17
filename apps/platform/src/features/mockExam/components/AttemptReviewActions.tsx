import type { AttemptReviewQuestion } from '@inzpro/api-contracts/modules/mock-exams/responses'
import type React from 'react'

import { AttemptFavoriteButton } from './AttemptFavoriteButton'
import { AttemptNoteDialog } from './AttemptNoteDialog'

type AttemptReviewActionsProps = { question: AttemptReviewQuestion }

export const AttemptReviewActions: React.FC<AttemptReviewActionsProps> = ({ question }) => (
  <div className="flex gap-2">
    <AttemptFavoriteButton question={question} />
    <AttemptNoteDialog question={question} />
  </div>
)
