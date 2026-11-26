import { Data, Duration, Effect } from 'effect'

export class FileDownloadError extends Data.TaggedError('FileDownloadError')<{
  readonly cause: unknown
}> {}

const objectUrlLifetime = Duration.seconds(10)

export const saveFile = (file: Blob, fileName: string) =>
  Effect.gen(function* () {
    const url = yield* Effect.try({
      try: () => URL.createObjectURL(file),
      catch: cause => new FileDownloadError({ cause }),
    })

    const revoke = Effect.sync(() => URL.revokeObjectURL(url))
    yield* Effect.try({
      try: () => {
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
      },
      catch: cause => new FileDownloadError({ cause }),
    }).pipe(Effect.onError(() => revoke))
    yield* Effect.sleep(objectUrlLifetime).pipe(Effect.ensuring(revoke), Effect.forkDetach)
  })
