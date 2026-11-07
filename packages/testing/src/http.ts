import { createServer } from 'node:http'

import { NodeHttpServer } from '@effect/platform-node'
import { Context, Effect, Layer, Predicate } from 'effect'
import { FetchHttpClient, HttpClient, HttpClientRequest, HttpRouter, HttpServer } from 'effect/http'

export type TestHttpServer = {
  readonly baseUrl: string
  readonly httpClient: HttpClient.HttpClient
}

export const withHttpServer = <A>(
  routes: ReadonlyArray<HttpRouter.Route>,
  use: (server: TestHttpServer) => Promise<A>,
): Promise<A> =>
  Effect.runPromise(
    Effect.gen(function* () {
      const serverLayer = HttpRouter.serve(HttpRouter.addAll(routes), { disableLogger: true }).pipe(
        Layer.provideMerge(NodeHttpServer.layer(createServer, { host: '127.0.0.1', port: 0 })),
      )

      const context = yield* Layer.build(serverLayer)
      const server = Context.get(context, HttpServer.HttpServer)

      if (Predicate.isTagged(server.address, 'UnixPathAddress')) {
        return yield* Effect.die(new Error('Expected a TCP server'))
      }

      const baseUrl = `http://127.0.0.1:${server.address.port}`

      const httpClient = yield* HttpClient.HttpClient.pipe(
        Effect.map(HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl))),
        Effect.provide(FetchHttpClient.layer),
      )

      return yield* Effect.promise(() => use({ baseUrl, httpClient }))
    }).pipe(Effect.scoped),
  )
