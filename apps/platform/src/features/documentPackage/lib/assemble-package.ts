import { Duration, Effect, Exit } from 'effect'

import { PackageError } from './package-error'
import type { PackageWorkerRequest, PackageWorkerResponse } from './package-worker'

const runPackageWorker = (request: PackageWorkerRequest) =>
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

      const services = yield* Effect.context<never>()

      return yield* Effect.callback<PackageWorkerResponse, PackageError>(resume => {
        const receiveMessage = (event: MessageEvent<PackageWorkerResponse>) =>
          resume(
            event.data.type === 'failed'
              ? Effect.fail(new PackageError({ cause: 'Package worker failed' }))
              : Effect.succeed(event.data),
          )

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

export const assemblePackage = (request: Extract<PackageWorkerRequest, { type: 'assemble' }>) =>
  runPackageWorker(request).pipe(
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

export const saveFile = (file: Uint8Array<ArrayBuffer>, fileName: string) =>
  Effect.gen(function* () {
    const url = yield* Effect.try({
      try: () => URL.createObjectURL(new Blob([file], { type: 'application/pdf' })),
      catch: cause => new PackageError({ cause }),
    })

    const revoke = Effect.sync(() => URL.revokeObjectURL(url))
    yield* Effect.try({
      try: () => {
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
      },
      catch: cause => new PackageError({ cause }),
    }).pipe(Effect.onError(() => revoke))
    yield* Effect.sleep(Duration.seconds(10)).pipe(Effect.ensuring(revoke), Effect.forkDetach)
  })
