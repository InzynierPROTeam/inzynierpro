import { Duration } from 'effect'

import type { PackageWorkerRequest, PackageWorkerResponse } from './package-worker'

export const assemblePackage = (urls: ReadonlyArray<string>) =>
  new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => {
    const worker = new Worker(new URL('./package-worker.ts', import.meta.url), { type: 'module' })

    worker.addEventListener('message', (event: MessageEvent<PackageWorkerResponse>) => {
      worker.terminate()

      if (event.data.type === 'assembled') {
        resolve(event.data.file)
      } else {
        reject(new Error('The document package could not be assembled.'))
      }
    })
    worker.addEventListener('error', error => {
      worker.terminate()
      reject(error)
    })
    worker.postMessage({ urls } satisfies PackageWorkerRequest)
  })

export const saveFile = (file: Uint8Array<ArrayBuffer>, fileName: string) => {
  const url = URL.createObjectURL(new Blob([file], { type: 'application/pdf' }))
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), Duration.toMillis(Duration.seconds(10)))
}
