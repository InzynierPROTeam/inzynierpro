import { AnswerOptionSkeleton } from '@inzpro/ui/components/answer-option'
import { Button } from '@inzpro/ui/components/button'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'

export const SessionAnswerFormSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-3">
      <TextSkeleton
        size="sm"
        className="w-32"
      />
      <div className="@container flex flex-col gap-4">
        <AnswerOptionSkeleton textClassName="max-w-24" />
        <AnswerOptionSkeleton textClassName="max-w-40" />
        <AnswerOptionSkeleton textClassName="max-w-32" />
      </div>
    </div>
    <Button disabled>Sprawdź</Button>
  </div>
)
