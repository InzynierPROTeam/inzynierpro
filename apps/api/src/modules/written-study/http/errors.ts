import {
  DocumentNotFound,
  InvalidSessionAnswer,
  SessionAnswerAlreadySubmitted,
  StudySessionAlreadyStarted,
} from '@inzpro/api-contracts/modules/written-study/errors'
import { Effect } from 'effect'
import type { UnfinishedSessionExists } from '~api/modules/written-study/domain/errors.js'

export const documentNotFound = Effect.fail(
  new DocumentNotFound({
    type: 'document_not_found',
    message: 'The selected material was not found.',
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
