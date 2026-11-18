import { OralStudySessionSummary } from '@inzpro/api-contracts/modules/oral-study/responses'
import { Schema } from 'effect'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'

import { OralSessionResultCard } from './OralSessionResultCard'

test.each([0, 6])('shows the XP actually earned in the oral session: %s', earnedXp => {
  const summary = Schema.decodeSync(OralStudySessionSummary)({
    id: '10000000-0000-4000-8000-000000000001',
    kind: 'study',
    category: null,
    status: 'ended',
    progress: { total: 3, answered: 3, skipped: 0, percent: 100, currentQuestion: 3 },
    createdAt: '2026-11-13T12:00:00.000Z',
    endedAt: '2026-11-13T12:05:00.000Z',
    result: { hard: 1, medium: 1, easy: 1, earnedXp },
  })

  const content = renderToStaticMarkup(<OralSessionResultCard summary={summary} />)

  expect(content).toContain(`Zdobyte punkty: ${earnedXp} XP`)
})
