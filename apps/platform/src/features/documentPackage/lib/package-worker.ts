import { Effect } from 'effect'

import fontUrl from '../assets/noto-sans.ttf?url'
import {
  countPackagePages,
  mergePdfs,
  type PackageDetails,
  type PackageDocument,
} from './merge-pdfs'
import { PackageError } from './package-error'

export type PackageWorkerRequest = PackageDetails &
  (
    | {
        readonly type: 'assemble'
        readonly documents: ReadonlyArray<PackageDocument & { readonly url: string }>
      }
    | {
        readonly type: 'count'
        readonly documents: ReadonlyArray<PackageDocument & { readonly pageCount: number }>
      }
  )

export type PackageWorkerResponse =
  | { readonly type: 'refresh'; readonly documentIndex: number }
  | { readonly type: 'assembled'; readonly file: Uint8Array<ArrayBuffer> }
  | { readonly type: 'counted'; readonly pageCount: number }
  | { readonly type: 'failed'; readonly documentIndex?: number }

type RefreshedUrl = {
  readonly type: 'refreshed'
  readonly documentIndex: number
  readonly url: string
}

const fetchFile = (url: string) =>
  Effect.tryPromise({
    try: signal => fetch(url, { signal }),
    catch: cause => new PackageError({ cause }),
  })

const readFile = (response: Response) =>
  Effect.gen(function* () {
    if (!response.ok) {
      return yield* new PackageError({ cause: `Download failed with status ${response.status}` })
    }

    return new Uint8Array(
      yield* Effect.tryPromise({
        try: () => response.arrayBuffer(),
        catch: cause => new PackageError({ cause }),
      }),
    )
  })

const refreshUrl = (documentIndex: number) =>
  Effect.callback<string, PackageError>(resume => {
    const receive = (event: MessageEvent<PackageWorkerRequest | RefreshedUrl>) => {
      if (event.data.type === 'refreshed' && event.data.documentIndex === documentIndex) {
        resume(Effect.succeed(event.data.url))
      }
    }

    addEventListener('message', receive)
    postMessage({ type: 'refresh', documentIndex } satisfies PackageWorkerResponse)

    return Effect.sync(() => removeEventListener('message', receive))
  })

const downloadPdf = (url: string, documentIndex: number) =>
  Effect.gen(function* () {
    let response = yield* fetchFile(url)

    if (response.status === 401 || response.status === 403) {
      response = yield* fetchFile(yield* refreshUrl(documentIndex))
    }

    const file = yield* readFile(response)

    if (
      response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !==
        'application/pdf' ||
      new TextDecoder().decode(file.subarray(0, 5)) !== '%PDF-'
    ) {
      return yield* new PackageError({ cause: 'The downloaded file is not a PDF' })
    }

    return file
  }).pipe(Effect.mapError(error => new PackageError({ cause: error, documentIndex })))

const processRequest = (request: PackageWorkerRequest) =>
  Effect.gen(function* () {
    const fontBytes = yield* fetchFile(fontUrl).pipe(Effect.flatMap(readFile))

    if (request.type === 'count') {
      return {
        type: 'counted',
        pageCount: yield* countPackagePages({ ...request, fontBytes }),
      } satisfies PackageWorkerResponse
    }

    const documents = yield* Effect.forEach(request.documents, (document, documentIndex) =>
      downloadPdf(document.url, documentIndex).pipe(Effect.map(file => ({ ...document, file }))),
    )

    const file = yield* mergePdfs({ ...request, documents, fontBytes })

    return { type: 'assembled', file: new Uint8Array(file) } satisfies PackageWorkerResponse
  })

const respond = (response: PackageWorkerResponse) =>
  Effect.sync(() =>
    postMessage(response, {
      transfer: response.type === 'assembled' ? [response.file.buffer] : [],
    }),
  )

addEventListener('message', (event: MessageEvent<PackageWorkerRequest | RefreshedUrl>) => {
  if (event.data.type === 'refreshed') {
    return
  }

  Effect.runFork(
    processRequest(event.data).pipe(
      Effect.flatMap(respond),
      Effect.catchTag('PackageError', error =>
        respond({ type: 'failed', documentIndex: error.documentIndex }),
      ),
      Effect.catchCause(() => respond({ type: 'failed' })),
    ),
  )
})
