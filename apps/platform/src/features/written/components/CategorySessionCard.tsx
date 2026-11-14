import type {
  ReferenceDocumentId,
  QuestionCount,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import type React from 'react'
import { DocumentSessionContent } from '~platform/features/learningSession/components/DocumentSessionContent'

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
    <DocumentSessionContent
      documentId={categoryId}
      availableQuestionCount={availableQuestionCount}
    />
  </Card>
)
