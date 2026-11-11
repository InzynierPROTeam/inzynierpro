import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

import { ConfigProvider, Effect, Layer } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'
import { isSensitiveAttribute, observabilityLayer } from '~api/lib/observability.js'

class TestReadError {
  readonly _tag = 'TestReadError'
}

// A stand-in OTLP collector that keeps every request body by signal path.
const received: Array<{ readonly path: string; readonly body: string }> = []

const collector = createServer((request, response) => {
  let body = ''

  request.on('data', (chunk: Buffer) => (body += chunk.toString()))
  request.on('end', () => {
    received.push({ path: request.url ?? '', body })
    response.writeHead(200, { 'content-type': 'application/json' }).end('{}')
  })
})

let endpoint: string

beforeAll(async () => {
  await new Promise<void>(resolve => collector.listen(0, '127.0.0.1', resolve))
  // SAFETY: a server listening on a TCP host and port reports an AddressInfo.
  endpoint = `http://127.0.0.1:${(collector.address() as AddressInfo).port}`
})

afterAll(() => new Promise(resolve => collector.close(resolve)))

const exportedTo = (path: string) =>
  received.flatMap(entry => (entry.path === path ? [entry.body] : [])).join('\n')

test('sensitive attribute names are recognised without catching ordinary ones', () => {
  expect(isSensitiveAttribute('client.address')).toBe(true)
  expect(isSensitiveAttribute('user.email')).toBe(true)
  expect(isSensitiveAttribute('app.sign_in.otp')).toBe(true)
  expect(isSensitiveAttribute('user.id')).toBe(false)
  expect(isSensitiveAttribute('http.response.status_code')).toBe(false)
  expect(isSensitiveAttribute('server.address')).toBe(false)
})

test('an infrastructure failure exports a failed span and an error log without sensitive data', async () => {
  const program = Effect.fail(new TestReadError()).pipe(
    Effect.withSpan('Test.read', {
      attributes: { 'user.id': 'user-1', 'user.email': 'person@example.com' },
    }),
    Effect.catchTag('TestReadError', logAndFailInternalServerError('Could not read test data.')),
    Effect.withSpan('Test.handler', { attributes: { 'client.address': '203.0.113.7' } }),
    Effect.exit,
  )

  const exit = await Effect.runPromise(
    Effect.provide(
      program,
      observabilityLayer([]).pipe(
        Layer.provide(
          ConfigProvider.layer(
            ConfigProvider.fromUnknown({
              OTEL_EXPORTER_OTLP_ENDPOINT: endpoint,
              OTEL_TRACES_EXPORTER: 'otlp',
              OTEL_LOGS_EXPORTER: 'otlp',
              OTEL_RESOURCE_ATTRIBUTES: 'deployment.environment.name=test',
            }),
          ),
        ),
      ),
    ),
  )

  expect(exit._tag).toBe('Failure')

  const traces = exportedTo('/v1/traces')
  const logs = exportedTo('/v1/logs')

  expect(traces).toContain('"Test.read"')
  expect(traces).toContain('"Test.handler"')
  expect(traces).toContain('inzpro-api')
  expect(traces).toContain('deployment.environment.name')
  expect(traces).toContain('TestReadError')
  expect(traces).toContain('user-1')
  expect(traces).not.toContain('person@example.com')
  expect(traces).not.toContain('203.0.113.7')

  expect(logs).toContain('Could not read test data.')
  expect(logs).toContain('error.type')
  expect(logs).toMatch(/"traceId":"[0-9a-f]{32}"/)
})
