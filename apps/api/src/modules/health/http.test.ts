import { Context, Effect, Exit, Layer, Logger, Predicate, Scope } from 'effect'
import { HttpServer } from 'effect/http'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { httpServerLayer } from '~api/http.js'

const scope = Scope.makeUnsafe()
let baseUrl: string

beforeAll(async () => {
  const context = await Effect.runPromise(
    Layer.buildWithScope(
      httpServerLayer(0, 'http://localhost:8001').pipe(Layer.provide(Logger.layer([]))),
      scope,
    ),
  )

  const server = Context.get(context, HttpServer.HttpServer)

  if (Predicate.isTagged(server.address, 'UnixPathAddress')) {
    throw new Error('Expected a TCP server')
  }

  baseUrl = `http://127.0.0.1:${server.address.port}`
})

afterAll(() => Effect.runPromise(Scope.close(scope, Exit.void)))

test('health-check uses /api/v1 and returns only status', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health-check`, {
    headers: { origin: 'http://localhost:8001' },
  })

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ status: 'ok' })
  expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/)
  expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:8001')
})

test('an unknown API version returns an error response', async () => {
  const response = await fetch(`${baseUrl}/api/v2/health-check`)
  const body = await response.json()

  expect(response.status).toBe(404)
  expect(body).toMatchObject({
    type: 'route_not_found',
    message: 'The requested API route was not found.',
  })
  expect(body).not.toHaveProperty('requestId')
  expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/)
})
