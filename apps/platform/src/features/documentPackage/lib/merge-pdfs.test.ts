import { readFile } from 'node:fs/promises'

import { Effect } from 'effect'
import { degrees, PDFDocument } from 'pdf-lib'
import { getDocument, type PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { expect, test } from 'vitest'

import { countPackagePages, mergePdfs } from './merge-pdfs'

const readPackage = (data: Uint8Array) =>
  getDocument({ data: new Uint8Array(data), useSystemFonts: false }).promise

const pageText = async (reader: PDFDocumentProxy, pageNumber: number) => {
  const content = await (await reader.getPage(pageNumber)).getTextContent()

  return content.items
    .flatMap(item => ('str' in item ? [item.str] : []))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const fontBytes = await readFile(new URL('../assets/noto-sans.ttf', import.meta.url))

const fixturePdf = async (pageCount: number) => {
  const document = await PDFDocument.create()

  for (let page = 0; page < pageCount; page++) {
    document.addPage([200 + page, 300])
  }

  return document.save()
}

const documentFixture = async (title: string, pageCount: number) => ({
  title,
  editionLabel: 'Wydanie z 2026 r.',
  textKindLabel: 'Tekst jednolity (urzędowy)',
  effectiveDate: '1 stycznia 2026',
  sourceUrl: 'https://example.com/ustawa.pdf',
  file: await fixturePdf(pageCount),
})

const packageDetails = {
  pathName: 'Konstrukcyjno-budowlana · Projektowanie · Bez ograniczeń',
  generationDate: '25 listopada 2026',
  fontBytes,
}

test('the package contains a cover, contents and a title page before each original document', async () => {
  const merged = await PDFDocument.load(
    await Effect.runPromise(
      mergePdfs({
        ...packageDetails,
        documents: [
          await documentFixture('Prawo budowlane', 2),
          await documentFixture('Samorządy', 3),
        ],
      }),
    ),
  )

  expect(merged.getPages().map(page => Math.round(page.getWidth()))).toEqual([
    595, 595, 595, 200, 201, 595, 200, 201, 202,
  ])
})

test('a file that is not a PDF stops the merge', async () => {
  await expect(
    Effect.runPromise(
      mergePdfs({
        ...packageDetails,
        documents: [
          {
            ...(await documentFixture('Uszkodzony dokument', 1)),
            file: new TextEncoder().encode('<html></html>'),
          },
        ],
      }),
    ),
  ).rejects.toThrow()
})

test('the contents and bookmarks point at the title pages after a contents spanning several pages', async () => {
  const documents = await Promise.all(
    Array.from({ length: 45 }, (_, index) =>
      documentFixture(`Dokument ${String(index + 1).padStart(2, '0')}`, 1),
    ),
  )

  const reader = await readPackage(
    await Effect.runPromise(mergePdfs({ ...packageDetails, documents })),
  )

  try {
    expect(reader.numPages).toBe(94)
    expect(await pageText(reader, 3)).toContain('Spis treści')
    expect(await pageText(reader, 4)).toContain('Spis treści')
    expect(await pageText(reader, 3)).toContain('1. Dokument 01 — Wydanie z 2026 r. 5')
    expect(await pageText(reader, 4)).toContain('45. Dokument 45 — Wydanie z 2026 r. 93')
    expect(await pageText(reader, 5)).toContain('Dokument 01')
    expect(await pageText(reader, 93)).toContain('Dokument 45')

    const outline = await reader.getOutline()
    expect(outline?.map(entry => entry.title)).toEqual(documents.map(document => document.title))

    for (const [index, entry] of (outline ?? []).entries()) {
      if (!Array.isArray(entry.dest)) {
        throw new Error('Expected an explicit bookmark destination')
      }

      expect(await reader.getPageIndex(entry.dest[0])).toBe(4 + index * 2)
    }
  } finally {
    await reader.loadingTask.destroy()
  }
})

test('Polish glyphs, edition metadata and numbered footers remain readable in the saved PDF', async () => {
  const reader = await readPackage(
    await Effect.runPromise(
      mergePdfs({
        ...packageDetails,
        documents: [await documentFixture('Zażółć gęślą jaźń — ŁÓŚĆŃĄĘŻŹ', 2)],
      }),
    ),
  )

  try {
    const cover = await pageText(reader, 1)
    const contents = await pageText(reader, 2)
    const title = await pageText(reader, 3)
    expect(cover).toContain('Pakiet dokumentów')
    expect(cover).toContain(packageDetails.pathName)
    expect(cover).toContain('Data wygenerowania: 25 listopada 2026')
    expect(cover).toContain('Zażółć gęślą jaźń — ŁÓŚĆŃĄĘŻŹ — Wydanie z 2026 r.')
    expect(cover).toContain('InżynierPRO 1')
    expect(contents).toContain('InżynierPRO 2')
    expect(title).toContain('Zażółć gęślą jaźń — ŁÓŚĆŃĄĘŻŹ')
    expect(title).toContain('Wydanie: Wydanie z 2026 r.')
    expect(title).toContain('Tekst jednolity (urzędowy)')
    expect(title).toContain('Obowiązuje od: 1 stycznia 2026')
    expect(title).toContain('Źródło: https://example.com/ustawa.pdf')
    expect(title).toContain('InżynierPRO 3')
    expect(await pageText(reader, 4)).toBe('4')
    expect(await pageText(reader, 5)).toBe('5')
  } finally {
    await reader.loadingTask.destroy()
  }
})

test('wrapped titles and unbroken source URLs stay inside the page and contents columns', async () => {
  const reader = await readPackage(
    await Effect.runPromise(
      mergePdfs({
        ...packageDetails,
        documents: [
          {
            ...(await documentFixture(
              'Rozporządzenie w sprawie szczegółowych warunków technicznych budynków i ich usytuowania '
                .repeat(4)
                .trim(),
              1,
            )),
            sourceUrl: `https://example.com/${'bardzo-dlugi-adres'.repeat(20)}.pdf`,
          },
        ],
      }),
    ),
  )

  try {
    for (const pageNumber of [1, 2, 3]) {
      const page = await reader.getPage(pageNumber)
      const content = await page.getTextContent()

      for (const item of content.items) {
        if ('str' in item && item.str.trim() !== '') {
          expect(item.transform[4]).toBeGreaterThanOrEqual(47)
          expect(item.transform[4] + item.width).toBeLessThanOrEqual(548)
          expect(item.transform[5]).toBeGreaterThanOrEqual(24)
        }
      }
    }

    expect(await pageText(reader, 2)).toContain(' 3 ')
  } finally {
    await reader.loadingTask.destroy()
  }
})

test('original page dimensions, cropping and rotation survive with only a visible corner number added', async () => {
  const source = await PDFDocument.create()

  for (const angle of [0, 90, 180, 270]) {
    const page = source.addPage([500, 700])
    page.setCropBox(50, 60, 300, 400)
    page.setRotation(degrees(angle))
    page.drawText('Original content', { x: 100, y: 200, size: 12 })
  }

  const bytes = await Effect.runPromise(
    mergePdfs({
      ...packageDetails,
      documents: [{ ...(await documentFixture('Oryginał', 1)), file: await source.save() }],
    }),
  )

  const merged = await PDFDocument.load(bytes)
  const reader = await readPackage(bytes)

  try {
    for (const [index, angle] of [0, 90, 180, 270].entries()) {
      const saved = merged.getPage(index + 3)
      expect(saved.getSize()).toEqual({ width: 500, height: 700 })
      expect(saved.getCropBox()).toEqual({ x: 50, y: 60, width: 300, height: 400 })
      expect(saved.getRotation().angle).toBe(angle)
      expect(await pageText(reader, index + 4)).toBe(`Original content ${index + 4}`)

      const page = await reader.getPage(index + 4)
      const viewport = page.getViewport({ scale: 1 })
      const content = await page.getTextContent()
      const number = content.items.find(item => 'str' in item && item.str === String(index + 4))
      expect(number).toBeDefined()

      if (number && 'str' in number) {
        const [x, y] = viewport.convertToViewportPoint(number.transform[4], number.transform[5])
        expect(x).toBeGreaterThan(viewport.width - 30)
        expect(x).toBeLessThan(viewport.width)
        expect(y).toBeGreaterThan(viewport.height - 20)
        expect(y).toBeLessThan(viewport.height)
      }
    }
  } finally {
    await reader.loadingTask.destroy()
  }
})

test('a title longer than a page continues without hiding the edition metadata below the footer', async () => {
  const reader = await readPackage(
    await Effect.runPromise(
      mergePdfs({
        ...packageDetails,
        documents: [
          await documentFixture(
            'Rozporządzenie w sprawie szczegółowych warunków technicznych i użytkowania budynków '
              .repeat(30)
              .trim(),
            1,
          ),
        ],
      }),
    ),
  )

  try {
    let text = ''

    for (let number = 1; number < reader.numPages; number++) {
      const page = await reader.getPage(number)
      const content = await page.getTextContent()
      text += await pageText(reader, number)

      for (const item of content.items) {
        if ('str' in item && item.str.trim() !== '') {
          expect(item.transform[5]).toBeGreaterThanOrEqual(24)
        }
      }
    }

    expect(text).toContain('Obowiązuje od: 1 stycznia 2026')
    expect(text).toContain('Źródło: https://example.com/ustawa.pdf')
  } finally {
    await reader.loadingTask.destroy()
  }
})

test('the preview count matches the saved package including the cover, contents and title pages', async () => {
  const documents = [
    await documentFixture('Prawo budowlane', 8),
    await documentFixture('Samorządy', 6),
  ]

  expect(
    await Effect.runPromise(
      countPackagePages({
        ...packageDetails,
        documents: [
          { ...documents[0]!, pageCount: 8 },
          { ...documents[1]!, pageCount: 6 },
        ],
      }),
    ),
  ).toBe(18)
  expect(
    (
      await PDFDocument.load(await Effect.runPromise(mergePdfs({ ...packageDetails, documents })))
    ).getPageCount(),
  ).toBe(18)
  expect(await Effect.runPromise(countPackagePages({ ...packageDetails, documents: [] }))).toBe(0)
})

test('the preview count includes multiple contents pages and overflowing title pages', async () => {
  const documents = await Promise.all(
    Array.from({ length: 45 }, (_, index) =>
      documentFixture(`Dokument ${String(index + 1).padStart(2, '0')}`, 1),
    ),
  )

  expect(
    await Effect.runPromise(
      countPackagePages({
        ...packageDetails,
        documents: documents.map(document => ({ ...document, pageCount: 1 })),
      }),
    ),
  ).toBe(94)

  const longTitle = {
    ...(await documentFixture(
      'Rozporządzenie w sprawie warunków technicznych '.repeat(60).trim(),
      2,
    )),
    pageCount: 2,
  }

  const previewCount = await Effect.runPromise(
    countPackagePages({ ...packageDetails, documents: [longTitle] }),
  )

  const saved = await PDFDocument.load(
    await Effect.runPromise(mergePdfs({ ...packageDetails, documents: [longTitle] })),
  )

  expect(previewCount).toBeGreaterThan(5)
  expect(previewCount).toBe(saved.getPageCount())
})
