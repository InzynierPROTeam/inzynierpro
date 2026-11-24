import { AwsClient } from 'aws4fetch'
import { Duration, Effect, Layer, Redacted } from 'effect'
import { fileStorageEnv } from '~api/lib/env.js'
import { FileStorageError } from '~api/modules/learning-content/application/errors.js'
import { FileStorage } from '~api/modules/learning-content/application/file-storage.service.js'

export type FileStorageS3Config = {
  readonly endpoint: URL
  readonly region: string
  readonly bucket: string
  readonly accessKeyId: string
  readonly secretAccessKey: Redacted.Redacted<string>
}

export const fileStorageS3Layer = (config: FileStorageS3Config) =>
  Layer.sync(FileStorage, () => {
    const client = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: Redacted.value(config.secretAccessKey),
      service: 's3',
      region: config.region,
    })

    const objectUrl = (key: string) => {
      const url = new URL(config.endpoint)
      const segments = [config.bucket, ...key.split('/')].map(encodeURIComponent)
      url.pathname = `${url.pathname.replace(/\/$/, '')}/${segments.join('/')}`

      return url
    }

    const signGet = Effect.fn('FileStorage.signGet')(function* (
      url: URL,
      lifetime: Duration.Duration,
    ) {
      url.searchParams.set('X-Amz-Expires', String(Math.floor(Duration.toSeconds(lifetime))))

      const signed = yield* Effect.tryPromise({
        try: () => client.sign(url, { method: 'GET', aws: { signQuery: true } }),
        catch: cause => new FileStorageError({ cause }),
      })

      return signed.url
    })

    return FileStorage.of({
      put: Effect.fn('FileStorage.put')(function* (file) {
        const response = yield* Effect.tryPromise({
          try: () =>
            client.fetch(objectUrl(file.key), {
              method: 'PUT',
              headers: { 'content-type': file.mediaType },
              body: file.body,
            }),
          catch: cause => new FileStorageError({ cause }),
        })

        if (!response.ok) {
          return yield* new FileStorageError({ cause: `PutObject responded ${response.status}` })
        }
      }),
      signedGetUrl: (key, lifetime) => signGet(objectUrl(key), lifetime),
      signedDownloadUrl: (key, lifetime, fileName) => {
        const url = objectUrl(key)
        url.searchParams.set('response-content-disposition', `attachment; filename="${fileName}"`)

        return signGet(url, lifetime)
      },
    })
  })

export const fileStorageS3LayerFromConfig = Layer.unwrap(
  Effect.map(fileStorageEnv, fileStorageS3Layer),
)
