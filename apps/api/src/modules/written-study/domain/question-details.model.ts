import type { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import type {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { RichContent } from '@inzpro/rich-content/rich-content'
import type { Option } from 'effect'
import type { QuestionNote } from '~api/modules/learning/domain/question-note.model.js'

export type QuestionDetails = {
  readonly questionId: WrittenQuestionId
  readonly questionRevisionId: QuestionRevisionId
  readonly body: string
  readonly answers: ReadonlyArray<{
    readonly id: QuestionAnswerId
    readonly text: string
    readonly isCorrect: boolean
  }>
  readonly explanation: RichContent
  readonly isFavorite: boolean
  readonly note: Option.Option<QuestionNote>
}
