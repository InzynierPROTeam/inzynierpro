import type {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import {
  favoritesStudySession,
  reviewStudySession,
} from '@inzpro/domain/modules/study/study-session'
import { Option } from 'effect'

import { defaultReviewQuestionCount } from './review-session.rules.js'
import type { StudySession } from './study-session.model.js'

/** The scope of a suggested review: one document, or the whole path when none. */
export type ReviewScope = { readonly documentId: Option.Option<ReferenceDocumentId> }

/**
 * The review a finished session suggests next, if any (ADR-0002). After a review: the rest of its
 * scope while questions there are due, then the whole path while anything is due. After regular
 * study: the whole path once a full review session is due; otherwise study continues. After
 * favourites: regular study, never a review.
 */
export const suggestedReview = (
  session: Pick<StudySession, 'kind' | 'documentId'>,
  due: {
    // Due in the session's own scope: its document for a document review, otherwise the path.
    readonly scope: QuestionCount
    readonly path: QuestionCount
  },
): Option.Option<ReviewScope> => {
  if (session.kind === reviewStudySession) {
    if (due.scope > 0) {
      return Option.some({ documentId: session.documentId })
    }

    return Option.isSome(session.documentId) && due.path > 0
      ? Option.some({ documentId: Option.none() })
      : Option.none()
  }

  if (session.kind === favoritesStudySession) {
    return Option.none()
  }

  return due.path >= defaultReviewQuestionCount
    ? Option.some({ documentId: Option.none() })
    : Option.none()
}
