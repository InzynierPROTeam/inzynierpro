import {
  DocumentNotFound,
  InvalidSessionAnswer,
  QuestionNotFound,
  SessionAnswerAlreadySubmitted,
  SessionQuestionNotFound,
  SessionQuestionWithdrawn,
  StaleSessionPreview,
  StudySessionAlreadyStarted,
  StudySessionEnded,
  StudySessionNotFound,
} from '@inzpro/api-contracts/modules/study/errors'
import { Effect } from 'effect'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'
import type { UnfinishedSessionExists } from '~api/modules/study/domain/errors.js'

export const failStudyRead = logAndFailInternalServerError('Could not read study material.')

export const documentNotFound = Effect.fail(
  new DocumentNotFound({
    type: 'document_not_found',
    message: 'The selected material was not found.',
  }),
)

export const questionNotFound = Effect.fail(
  new QuestionNotFound({
    type: 'question_not_found',
    message: 'The question was not found on this path.',
  }),
)

export const failStudyWrite = logAndFailInternalServerError('Could not save study progress.')

export const failQuestionNoteWrite = logAndFailInternalServerError('Could not save the note.')

export const staleSessionPreview = Effect.fail(
  new StaleSessionPreview({
    type: 'stale_session_preview',
    message: 'The available questions or settings changed. Review the preview before starting.',
  }),
)

export const studySessionAlreadyStarted = (error: UnfinishedSessionExists) =>
  Effect.fail(
    new StudySessionAlreadyStarted({
      type: 'study_session_already_started',
      message: 'This material already has an unfinished study session. Continue it instead.',
      sessionId: error.sessionId,
      currentPosition: error.currentPosition,
    }),
  )

export const studySessionNotFound = Effect.fail(
  new StudySessionNotFound({
    type: 'study_session_not_found',
    message: 'The study session was not found.',
  }),
)

export const sessionQuestionNotFound = Effect.fail(
  new SessionQuestionNotFound({
    type: 'session_question_not_found',
    message: 'The study session question was not found.',
  }),
)

export const studySessionEnded = Effect.fail(
  new StudySessionEnded({
    type: 'study_session_ended',
    message: 'This study session has ended and accepts no more answers.',
  }),
)

export const sessionQuestionWithdrawn = Effect.fail(
  new SessionQuestionWithdrawn({
    type: 'session_question_withdrawn',
    message: 'This question was withdrawn and accepts no more answers.',
  }),
)

export const invalidSessionAnswer = Effect.fail(
  new InvalidSessionAnswer({
    type: 'invalid_session_answer',
    message: 'The answer does not belong to this session question.',
  }),
)

export const sessionAnswerAlreadySubmitted = Effect.fail(
  new SessionAnswerAlreadySubmitted({
    type: 'session_answer_already_submitted',
    message: 'This question already has a submitted answer in this session.',
  }),
)
