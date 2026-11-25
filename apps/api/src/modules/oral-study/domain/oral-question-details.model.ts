import type {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import type { RichContent } from '@inzpro/rich-content/rich-content'
import type { Option } from 'effect'
import type { QuestionNote } from '~api/modules/learning/domain/question-note.model.js'

export type OralQuestionDetails = {
  readonly questionId: OralQuestionId
  readonly oralRevisionId: OralRevisionId
  readonly body: RichContent
  readonly answer: RichContent
  readonly isFavorite: boolean
  readonly note: Option.Option<QuestionNote>
}
