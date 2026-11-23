import { Duration, Effect } from 'effect'
import { expect, test } from 'vitest'
import { FileStorage } from '~api/modules/learning-content/application/file-storage.service.js'
import { fixtureAssetBytes } from '~api/test/content-fixtures.js'
import { runWithFileStorage } from '~api/test/file-storage.js'

const storeFile = (key: string) =>
  runWithFileStorage(
    Effect.flatMap(FileStorage, fileStorage =>
      fileStorage.put({ key, mediaType: 'image/png', body: fixtureAssetBytes }),
    ),
  )

const signedGetUrl = (key: string, lifetime = Duration.hours(1)) =>
  runWithFileStorage(
    Effect.flatMap(FileStorage, fileStorage => fileStorage.signedGetUrl(key, lifetime)),
  )

test('a stored file reads back through its signed address', async () => {
  const key = `test/${crypto.randomUUID()}/schody.png`
  await storeFile(key)

  const response = await fetch(await signedGetUrl(key))

  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toBe('image/png')
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(fixtureAssetBytes)
})

test('a signed address is valid for the requested lifetime', async () => {
  const url = new URL(await signedGetUrl(`test/${crypto.randomUUID()}.png`, Duration.hours(1)))

  expect(url.searchParams.get('X-Amz-Expires')).toBe('3600')
})

test('the bucket refuses a stored file without a signature', async () => {
  const key = `test/${crypto.randomUUID()}.png`
  await storeFile(key)
  const url = new URL(await signedGetUrl(key))

  const response = await fetch(`${url.origin}${url.pathname}`)

  expect(response.status).toBe(403)
})

test('the bucket refuses a signed address whose signature was altered', async () => {
  const key = `test/${crypto.randomUUID()}.png`
  await storeFile(key)
  const url = new URL(await signedGetUrl(key))
  url.searchParams.set('X-Amz-Signature', '0'.repeat(64))

  const response = await fetch(url)

  expect(response.status).toBe(403)
})

test('a signed address of a file that was never stored reads as missing', async () => {
  const response = await fetch(await signedGetUrl(`test/${crypto.randomUUID()}.png`))

  expect(response.status).toBe(404)
})
