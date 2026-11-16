import type { Email } from '@inzpro/domain/common/email'
import {
  createEmailClient,
  type EmailAdapter,
  type EmailErrorCode,
  EmailSdkError,
} from '@opencoredev/email-sdk'
import { resend } from '@opencoredev/email-sdk/resend'
import { Context, Data, Effect, Layer, Redacted } from 'effect'
import type { ReactElement } from 'react'
import { render, toPlainText } from 'react-email'

export type SendEmailRequest = {
  readonly from: string
  readonly to: ReadonlyArray<Email>
  readonly replyTo?: Email
  readonly subject: string
  readonly template: ReactElement
}

// Carries only why sending failed, never the message, so it is safe to log.
export class EmailSendFailed extends Data.TaggedError('EmailSendFailed')<{
  readonly reason: EmailErrorCode | 'render_failed' | 'unknown'
}> {
  override get message() {
    return `Email could not be sent (${this.reason}).`
  }
}

export class EmailService extends Context.Service<
  EmailService,
  { readonly send: (request: SendEmailRequest) => Effect.Effect<void, EmailSendFailed> }
>()('EmailService') {}

export const make = (adapter: EmailAdapter) => {
  // The SDK reports usage to its authors unless disabled.
  const client = createEmailClient({ adapters: [adapter], telemetry: false })

  return EmailService.of({
    send: Effect.fn('EmailService.send')(function* (request: SendEmailRequest) {
      const html = yield* Effect.tryPromise({
        try: () => render(request.template),
        catch: () => new EmailSendFailed({ reason: 'render_failed' }),
      })

      yield* Effect.tryPromise({
        try: () =>
          client.send({
            from: request.from,
            to: [...request.to],
            replyTo: request.replyTo,
            subject: request.subject,
            html,
            text: toPlainText(html),
          }),
        catch: error =>
          new EmailSendFailed({ reason: error instanceof EmailSdkError ? error.code : 'unknown' }),
      })
    }),
  })
}

export const layer = (adapter: EmailAdapter) => Layer.sync(EmailService, () => make(adapter))

export type ResendConfig = {
  readonly apiKey: Redacted.Redacted
  readonly baseUrl?: string
}

export const layerResend = (config: ResendConfig) =>
  layer(
    resend(
      config.baseUrl === undefined
        ? { apiKey: Redacted.value(config.apiKey) }
        : { apiKey: Redacted.value(config.apiKey), baseUrl: config.baseUrl },
    ),
  )
