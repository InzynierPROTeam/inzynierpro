import { mergePdfs } from './merge-pdfs'

export type PackageWorkerRequest = { readonly urls: ReadonlyArray<string> }

export type PackageWorkerResponse =
  | { readonly type: 'assembled'; readonly file: Uint8Array<ArrayBuffer> }
  | { readonly type: 'failed' }

const downloadPdf = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`The PDF download failed with status ${response.status}.`)
  }

  return new Uint8Array(await response.arrayBuffer())
}

const assemble = async (urls: ReadonlyArray<string>) => {
  const files: Array<Uint8Array> = []

  for (const url of urls) {
    files.push(await downloadPdf(url))
  }

  return new Uint8Array(await mergePdfs(files))
}

const respond = (response: PackageWorkerResponse) =>
  postMessage(response, { transfer: response.type === 'assembled' ? [response.file.buffer] : [] })

addEventListener('message', (event: MessageEvent<PackageWorkerRequest>) => {
  assemble(event.data.urls).then(
    file => respond({ type: 'assembled', file }),
    () => respond({ type: 'failed' }),
  )
})
