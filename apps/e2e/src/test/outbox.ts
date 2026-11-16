import { readFile } from 'node:fs/promises'

import { expect } from '@playwright/test'
import { Schema } from 'effect'

import { outboxPath } from '../environment'

const SentEmail = Schema.Struct({
  to: Schema.Union([Schema.String, Schema.Array(Schema.String)]),
  text: Schema.optional(Schema.String),
})

const decodeSentEmail = Schema.decodeUnknownSync(Schema.fromJsonString(SentEmail))

const codesSentTo = async (email: string) =>
  (await readFile(outboxPath, 'utf8'))
    .split('\n')
    .filter(line => line !== '')
    .map(line => decodeSentEmail(line))
    .filter(sent => [sent.to].flat().includes(email))
    .map(sent => sent.text?.match(/\b(\d{6})\b/)?.[1])

export const latestSignInCode = async (email: string, previousEmailCount = 0) => {
  await expect
    .poll(async () => (await codesSentTo(email)).length, { message: `No code sent to ${email}` })
    .toBeGreaterThan(previousEmailCount)

  const code = (await codesSentTo(email)).at(-1)

  if (code === undefined) {
    throw new Error(`The e-mail to ${email} holds no sign-in code`)
  }

  return code
}

export const sentEmailCount = async (email: string) => (await codesSentTo(email)).length
