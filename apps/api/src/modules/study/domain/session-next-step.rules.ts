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

export type ReviewScope = { readonly documentId: Option.Option<ReferenceDocumentId> }

export const suggestedReview = (
  session: Pick<StudySession, 'kind' | 'documentId'>,
  due: {
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
