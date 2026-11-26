import { StaleSessionPreview } from '@inzpro/api-contracts/modules/learning/errors'
import {
  DistrictChamberNotChosen,
  OralSessionAlreadyStarted,
} from '@inzpro/api-contracts/modules/oral-study/errors'
import { InternalServerError } from '@inzpro/api-contracts/utils/api-error'
import { Schema } from 'effect'
import { expect, test } from 'vitest'

import { getOralReviewStartError } from './utils'

test('a competing review offers the stored session and position instead of starting another one', () => {
  const error = new OralSessionAlreadyStarted({
    type: 'oral_session_already_started',
    message: 'Already started.',
    sessionId: Schema.decodeSync(OralSessionAlreadyStarted.fields.sessionId)(
      '10000000-0000-4000-8000-000000000001',
    ),
    currentPosition: Schema.decodeSync(OralSessionAlreadyStarted.fields.currentPosition)(3),
  })

  expect(getOralReviewStartError(error)).toEqual({
    title: 'Masz już rozpoczętą powtórkę w tym zakresie.',
    continuation: { sessionId: '10000000-0000-4000-8000-000000000001', questionNumber: 3 },
  })
})

test('a stale review asks the learner to check the refreshed preview', () => {
  expect(
    getOralReviewStartError(
      new StaleSessionPreview({ type: 'stale_session_preview', message: 'Changed.' }),
    ),
  ).toEqual({
    title: 'Pytania do powtórki zmieniły się. Sprawdź szczegóły i spróbuj ponownie.',
    continuation: null,
  })
})

test('an infrastructure failure shows Polish feedback without leaking the technical message', () => {
  expect(
    getOralReviewStartError(
      new InternalServerError({ type: 'internal_server_error', message: 'Database unavailable.' }),
    ),
  ).toEqual({ title: 'Nie udało się rozpocząć powtórki. Spróbuj ponownie.', continuation: null })
})

test('a review filtered by a chamber that was cleared meanwhile asks the learner to refresh', () => {
  expect(
    getOralReviewStartError(
      new DistrictChamberNotChosen({
        type: 'district_chamber_not_chosen',
        message: 'No district chamber.',
      }),
    ),
  ).toEqual({
    title: 'Ta ścieżka nie ma już wybranej izby okręgowej. Odśwież stronę i spróbuj ponownie.',
    continuation: null,
  })
})
