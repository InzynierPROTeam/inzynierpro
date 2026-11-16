import { fileURLToPath } from 'node:url'

export const apiUrl = 'http://localhost:4100'

export const platformUrl = 'http://localhost:8101'

// The business date of the suite: the E2E API runs on `catalogueTestTime` from
// `apps/api/src/test/clock.ts`, and every browser page is fixed to the same instant.
export const businessTime = '2026-11-13T12:00:00.000Z'

export const outboxPath = fileURLToPath(new URL('../.outbox/emails.jsonl', import.meta.url))
