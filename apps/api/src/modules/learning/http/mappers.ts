import type { QuestionNote as QuestionNoteDto } from '@inzpro/api-contracts/modules/learning/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import type { QuestionNote } from '~api/modules/learning/domain/question-note.model.js'

export const toQuestionNoteDto = ({ updatedAt, ...note }: QuestionNote): QuestionNoteDto => ({
  ...note,
  updatedAt: dateTimeUtcToUtcIsoDateTime(updatedAt),
})
