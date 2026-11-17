import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { Percent } from '@inzpro/domain/common/percent'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { QuestionNoteText } from '@inzpro/domain/modules/learning/question-note'
import { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import { Schema } from 'effect'

export const SessionCountSettings = Schema.Struct({
  defaultQuestionCount: QuestionCount,
  canChangeQuestionCount: Schema.Boolean,
  minimumQuestionCount: QuestionCount,
  maximumQuestionCount: QuestionCount,
})

export type SessionCountSettings = typeof SessionCountSettings.Type

export const QuestionNote = Schema.Struct({
  text: QuestionNoteText,
  updatedAt: UtcIsoDateTime,
  // CONTRACT: Compares substantive content with the revision current at the last note edit.
  refersToEarlierWording: Schema.Boolean,
})

export type QuestionNote = typeof QuestionNote.Type

export const StudySessionProgress = Schema.Struct({
  total: QuestionCount,
  answered: QuestionCount,
  skipped: QuestionCount,
  percent: Percent,
  currentQuestion: SessionQuestionPosition,
})

export type StudySessionProgress = typeof StudySessionProgress.Type
