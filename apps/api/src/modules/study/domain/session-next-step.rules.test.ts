import {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { regularStudySession, reviewStudySession } from '@inzpro/domain/modules/study/study-session'
import { Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { suggestedReview } from './session-next-step.rules.js'

const count = Schema.decodeSync(QuestionCount)
const documentId = Schema.decodeSync(ReferenceDocumentId)('20000000-0000-4000-8000-000000000001')

const pathReview = Option.some({ documentId: Option.none() })

describe('after a review session', () => {
  it('suggests reviewing the rest of its scope while questions there are due', () =>
    expect(
      suggestedReview(
        { kind: reviewStudySession, documentId: Option.some(documentId) },
        { scope: count(15), path: count(40) },
      ),
    ).toStrictEqual(Option.some({ documentId: Option.some(documentId) })))

  it('moves on to the whole path once its document has nothing due', () =>
    expect(
      suggestedReview(
        { kind: reviewStudySession, documentId: Option.some(documentId) },
        { scope: count(0), path: count(3) },
      ),
    ).toStrictEqual(pathReview))

  it('suggests no review once nothing is due', () =>
    expect(
      suggestedReview(
        { kind: reviewStudySession, documentId: Option.none() },
        { scope: count(0), path: count(0) },
      ),
    ).toStrictEqual(Option.none()))
})

describe('after regular study', () => {
  it('suggests a review of the path once a full review session is due', () =>
    expect(
      suggestedReview(
        { kind: regularStudySession, documentId: Option.some(documentId) },
        { scope: count(25), path: count(25) },
      ),
    ).toStrictEqual(pathReview))

  it('keeps studying while fewer questions are due', () =>
    expect(
      suggestedReview(
        { kind: regularStudySession, documentId: Option.some(documentId) },
        { scope: count(24), path: count(24) },
      ),
    ).toStrictEqual(Option.none()))
})
