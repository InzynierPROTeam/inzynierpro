import { fileURLToPath } from 'node:url'

export const apiUrl = 'http://localhost:4100'

export const platformUrl = 'http://localhost:8101'

export const businessTime = '2026-11-13T12:00:00.000Z'

export const outboxPath = fileURLToPath(new URL('../.outbox/emails.jsonl', import.meta.url))
