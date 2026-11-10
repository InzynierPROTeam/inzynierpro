import { Email } from '@inzpro/domain/common/email'
import { withHttpServer } from '@inzpro/testing/http'
import { failingAdapter, memoryAdapter } from '@opencoredev/email-sdk/testing'
import { Effect, Redacted, Schema } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'
import { describe, expect, it } from 'vitest'
import {
  EmailSendFailed,
  EmailService,
  layer,
  layerResend,
  type SendEmailRequest,
} from '~email/email-service.js'

const request: SendEmailRequest = {
  from: 'InżynierPRO <info@inzynier.pro>',
  to: [Schema.decodeSync(Email)('kandydat@example.com')],
  subject: 'Zaloguj się do InżynierPRO',
  template: <p>Twój kod: 123456</p>,
}

const send = Effect.gen(function* () {
  const emailService = yield* EmailService

  yield* emailService.send(request)
})

describe('EmailService', () => {
  it('renders the template to HTML and plain text', async () => {
    const adapter = memoryAdapter()

    await Effect.runPromise(send.pipe(Effect.provide(layer(adapter))))

    expect(adapter.raw?.sent).toHaveLength(1)
    expect(adapter.raw?.sent[0]?.message).toMatchObject({
      from: request.from,
      to: ['kandydat@example.com'],
      subject: request.subject,
      text: 'Twój kod: 123456',
    })
    expect(adapter.raw?.sent[0]?.message.html).toContain('<p>Twój kod: 123456</p>')
  })

  it('reports a failed delivery as a typed error without the message content', async () => {
    const error = await Effect.runPromise(
      send.pipe(Effect.provide(layer(failingAdapter())), Effect.flip),
    )

    expect(error).toBeInstanceOf(EmailSendFailed)
    expect(JSON.stringify(error)).not.toContain('123456')
  })

  it('sends through Resend with the API key', () => {
    const received: Array<{ authorization: string | undefined; body: unknown }> = []

    return withHttpServer(
      [
        HttpRouter.route(
          'POST',
          '/emails',
          Effect.gen(function* () {
            const incoming = yield* HttpServerRequest.HttpServerRequest

            received.push({
              authorization: incoming.headers.authorization,
              body: yield* Effect.orDie(incoming.json),
            })

            return HttpServerResponse.jsonUnsafe({ id: 'email-id' })
          }),
        ),
      ],
      async ({ baseUrl }) => {
        await Effect.runPromise(
          send.pipe(Effect.provide(layerResend({ apiKey: Redacted.make('re_key'), baseUrl }))),
        )

        expect(received).toMatchObject([
          {
            authorization: 'Bearer re_key',
            body: { from: request.from, to: ['kandydat@example.com'], subject: request.subject },
          },
        ])
      },
    )
  })

  it('maps a rejected Resend request to EmailSendFailed', () =>
    withHttpServer(
      [
        HttpRouter.route(
          'POST',
          '/emails',
          HttpServerResponse.jsonUnsafe({ message: 'invalid' }, { status: 422 }),
        ),
      ],
      async ({ baseUrl }) => {
        const error = await Effect.runPromise(
          send.pipe(
            Effect.provide(layerResend({ apiKey: Redacted.make('re_key'), baseUrl })),
            Effect.flip,
          ),
        )

        expect(error).toBeInstanceOf(EmailSendFailed)
      },
    ))
})
