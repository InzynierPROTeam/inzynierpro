import { readFile } from 'node:fs/promises'

import { PDFDocument } from 'pdf-lib'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import type { PackageWorkerRequest, PackageWorkerResponse } from './package-worker'

const messages: Array<PackageWorkerResponse> = []
const incoming = new EventTarget()
const fontBytes = await readFile(new URL('../assets/noto-sans.ttf', import.meta.url))
const pdf = await PDFDocument.create()

pdf.addPage()

const pdfBytes = new Uint8Array(await pdf.save())

const request: PackageWorkerRequest = {
  type: 'assemble',
  pathName: 'Test path',
  generationDate: '26 listopada 2026',
  documents: [
    {
      title: 'Test document',
      editionLabel: '2026',
      textKindLabel: 'Tekst jednolity',
      effectiveDate: '1 stycznia 2026',
      sourceUrl: 'https://example.com/source',
      url: 'https://example.com/expired.pdf',
    },
  ],
}

const send = (
  data: PackageWorkerRequest | { type: 'refreshed'; documentIndex: number; url: string },
) => incoming.dispatchEvent(new MessageEvent('message', { data }))

beforeEach(async () => {
  messages.length = 0
  vi.stubGlobal('addEventListener', incoming.addEventListener.bind(incoming))
  vi.stubGlobal('removeEventListener', incoming.removeEventListener.bind(incoming))
  vi.stubGlobal('postMessage', (message: PackageWorkerResponse) => messages.push(message))
  await import('./package-worker')
})

afterEach(() => vi.unstubAllGlobals())

test('an expired signed URL is refreshed once before the document is downloaded and merged', async () => {
  vi.stubGlobal('fetch', async (url: string) => {
    if (url === 'https://example.com/expired.pdf') {
      return new Response('', { status: 403 })
    }

    if (url === 'https://example.com/fresh.pdf') {
      return new Response(pdfBytes, { headers: { 'content-type': 'application/pdf' } })
    }

    return new Response(fontBytes)
  })
  send(request)
  await vi.waitFor(() => expect(messages).toContainEqual({ type: 'refresh', documentIndex: 0 }))
  send({ type: 'refreshed', documentIndex: 0, url: 'https://example.com/fresh.pdf' })
  await vi.waitFor(() => expect(messages.some(message => message.type === 'assembled')).toBe(true))
})

test('a refreshed URL that is still expired fails without requesting another refresh', async () => {
  vi.stubGlobal('fetch', async (url: string) =>
    url.includes('example.com') ? new Response('', { status: 403 }) : new Response(fontBytes),
  )
  send(request)
  await vi.waitFor(() => expect(messages).toContainEqual({ type: 'refresh', documentIndex: 0 }))
  send({ type: 'refreshed', documentIndex: 0, url: 'https://example.com/still-expired.pdf' })
  await vi.waitFor(() => expect(messages).toContainEqual({ type: 'failed', documentIndex: 0 }))
  expect(messages.filter(message => message.type === 'refresh')).toHaveLength(1)
  expect(messages.some(message => message.type === 'assembled')).toBe(false)
})

test.each([
  ['a failed download', 500, 'application/pdf', pdfBytes],
  ['a non-PDF response', 200, 'text/html', new TextEncoder().encode('<html>Error</html>')],
  ['a mislabeled response', 200, 'application/pdf', new TextEncoder().encode('<html>Error</html>')],
  ['a corrupt PDF', 200, 'application/pdf', new TextEncoder().encode('%PDF-1.7\ncorrupt')],
])(
  '%s identifies the failed document and never produces a partial file',
  async (_label, status, contentType, bytes) => {
    vi.stubGlobal('fetch', async (url: string) =>
      url.includes('example.com')
        ? new Response(bytes, { status, headers: { 'content-type': contentType } })
        : new Response(fontBytes),
    )
    send(request)
    await vi.waitFor(() => expect(messages).toContainEqual({ type: 'failed', documentIndex: 0 }))
    expect(
      messages.some(message => message.type === 'assembled' || message.type === 'refresh'),
    ).toBe(false)
  },
)
