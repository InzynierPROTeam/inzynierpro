import { Effect, Exit } from 'effect'
import { constVoid } from 'effect/Function'

import { PackageError } from './package-error'
import type { PackageWorkerRequest, PackageWorkerResponse } from './package-worker'

type PackageWorkerOptions<R = never> = {
  readonly refreshUrl?: (documentIndex: number) => Effect.Effect<string, PackageError, R>
}

const runPackageWorker = <R = never>(
  request: PackageWorkerRequest,
  options: PackageWorkerOptions<R> = {},
) =>
  Effect.scoped(
    Effect.gen(function* () {
      const worker = yield* Effect.acquireRelease(
        Effect.try({
          try: () =>
            new Worker(new URL('./package-worker.ts', import.meta.url), { type: 'module' }),
          catch: cause => new PackageError({ cause }),
        }),
        worker => Effect.sync(() => worker.terminate()),
      )

      const services = yield* Effect.context<R>()

      const controller = yield* Effect.acquireRelease(
        Effect.sync(() => new AbortController()),
        controller => Effect.sync(() => controller.abort()),
      )

      return yield* Effect.callback<PackageWorkerResponse, PackageError>(resume => {
        const receiveMessage = (event: MessageEvent<PackageWorkerResponse>) => {
          const response = event.data

          if (response.type === 'refresh') {
            const refresh =
              options.refreshUrl?.(response.documentIndex) ??
              Effect.fail(
                new PackageError({
                  cause: 'URL refresh unavailable',
                  documentIndex: response.documentIndex,
                }),
              )

            void Effect.runPromiseWith(services)(
              refresh.pipe(
                Effect.flatMap(url =>
                  Effect.try({
                    try: () =>
                      worker.postMessage({
                        type: 'refreshed',
                        documentIndex: response.documentIndex,
                        url,
                      }),
                    catch: cause =>
                      new PackageError({ cause, documentIndex: response.documentIndex }),
                  }),
                ),
                Effect.catchCause(cause =>
                  Effect.sync(() =>
                    resume(
                      Effect.fail(
                        new PackageError({ cause, documentIndex: response.documentIndex }),
                      ),
                    ),
                  ),
                ),
              ),
              { signal: controller.signal },
            ).catch(constVoid)

            return
          }

          resume(
            response.type === 'failed'
              ? Effect.fail(
                  new PackageError({
                    cause: 'Package worker failed',
                    documentIndex: response.documentIndex,
                  }),
                )
              : Effect.succeed(response),
          )
        }

        const receiveError = (cause: ErrorEvent) => resume(Effect.fail(new PackageError({ cause })))
        worker.addEventListener('message', receiveMessage)
        worker.addEventListener('error', receiveError)

        const sent = Effect.runSyncExitWith(services)(
          Effect.try({
            try: () => worker.postMessage(request),
            catch: cause => new PackageError({ cause }),
          }),
        )

        if (Exit.isFailure(sent)) {
          resume(Effect.failCause(sent.cause))
        }

        return Effect.sync(() => {
          worker.removeEventListener('message', receiveMessage)
          worker.removeEventListener('error', receiveError)
        })
      })
    }),
  )

export const assemblePackage = <R = never>(
  request: Extract<PackageWorkerRequest, { type: 'assemble' }>,
  options: PackageWorkerOptions<R> = {},
) =>
  runPackageWorker(request, options).pipe(
    Effect.flatMap(response =>
      response.type === 'assembled'
        ? Effect.succeed(response.file)
        : Effect.fail(new PackageError({ cause: 'Expected an assembled package' })),
    ),
  )

export const countPackagePages = (request: Extract<PackageWorkerRequest, { type: 'count' }>) =>
  runPackageWorker(request).pipe(
    Effect.flatMap(response =>
      response.type === 'counted'
        ? Effect.succeed(response.pageCount)
        : Effect.fail(new PackageError({ cause: 'Expected a package page count' })),
    ),
  )
