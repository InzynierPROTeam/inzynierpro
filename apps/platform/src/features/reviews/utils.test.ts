import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { noDueReviewsMessage } from './utils'

describe('with nothing due', () => {
  it('says reviews come later when one is scheduled', () =>
    expect(noDueReviewsMessage(Schema.decodeSync(UtcIsoDateTime)('2026-11-14T08:30:00.000Z'))).toBe(
      'Na teraz nie masz pytań do powtórki. Wróć do nich później.',
    ))

  it('explains how reviews get scheduled when none is', () =>
    expect(noDueReviewsMessage(null)).toBe(
      'Brak zaplanowanych powtórek. Odpowiadaj na pytania w nauce, a zaplanujemy je dla Ciebie.',
    ))
})
