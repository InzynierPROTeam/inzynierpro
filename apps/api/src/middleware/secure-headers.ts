import { Effect } from 'effect'
import { HttpEffect, HttpServerResponse } from 'effect/http'

const secureHeaders = {
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'origin-agent-cluster': '?1',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-dns-prefetch-control': 'off',
  'x-download-options': 'noopen',
  'x-frame-options': 'DENY',
  'x-permitted-cross-domain-policies': 'none',
  'x-xss-protection': '0',
}

export const SecureHeadersMiddleware = <E, R>(
  httpEffect: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>,
) =>
  HttpEffect.withPreResponseHandler(httpEffect, (_request, response) =>
    Effect.succeed(HttpServerResponse.setHeaders(response, secureHeaders)),
  )
