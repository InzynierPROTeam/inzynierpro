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
  | { readonly type: 'assembled'; readonly file: Uint8Array<ArrayBuffer> }
  | { readonly type: 'counted'; readonly pageCount: number }
  | { readonly type: 'failed' }

const downloadPdf = (url: string) =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: signal => fetch(url, { signal }),
      catch: cause => new PackageError({ cause }),
    })

    if (!response.ok) {
      return yield* new PackageError({ cause: `Download failed with status ${response.status}` })
    }

    const bytes = yield* Effect.tryPromise({
      try: () => response.arrayBuffer(),
      catch: cause => new PackageError({ cause }),
    })

    return new Uint8Array(bytes)
  })

const processRequest = (request: PackageWorkerRequest) =>
  Effect.gen(function* () {
    const fontBytes = yield* downloadPdf(fontUrl)

    if (request.type === 'count') {
      return {
        type: 'counted',
        pageCount: yield* countPackagePages({ ...request, fontBytes }),
      } satisfies PackageWorkerResponse
    }

    const documents = yield* Effect.forEach(request.documents, document =>
      downloadPdf(document.url).pipe(Effect.map(file => ({ ...document, file }))),
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

addEventListener('message', (event: MessageEvent<PackageWorkerRequest>) => {
  Effect.runFork(
    processRequest(event.data).pipe(
      Effect.matchCauseEffect({ onSuccess: respond, onFailure: () => respond({ type: 'failed' }) }),
    ),
  )
})
