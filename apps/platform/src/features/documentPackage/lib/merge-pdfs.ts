import { appName } from '@inzpro/config/app'
import fontkit from '@pdf-lib/fontkit'
import { Effect, Match } from 'effect'
import { degrees, PageSizes, PDFDocument, PDFFont, PDFHexString, PDFName, PDFPage } from 'pdf-lib'

import { PackageError } from './package-error'

export type PackageDocument = {
  readonly title: string
  readonly editionLabel: string
  readonly textKindLabel: string
  readonly effectiveDate: string
  readonly sourceUrl: string
}

export type PackageDetails = {
  readonly pathName: string
  readonly generationDate: string
}

type PackageFile = PackageDocument & { readonly file: Uint8Array }

const margin = 48
const bottom = 64
const lineHeight = 18
const bodySize = 11
const contentWidth = PageSizes.A4[0] - margin * 2

const wrapText = (text: string, font: PDFFont, size: number, width: number) => {
  const lines: Array<string> = []
  let line = ''

  for (const word of text.trim().split(/\s+/)) {
    const joined = line === '' ? word : `${line} ${word}`

    if (font.widthOfTextAtSize(joined, size) <= width) {
      line = joined
      continue
    }

    if (line !== '') {
      lines.push(line)
      line = ''
    }

    for (const character of word) {
      if (font.widthOfTextAtSize(line + character, size) > width && line !== '') {
        lines.push(line)
        line = ''
      }

      line += character
    }
  }

  lines.push(line)

  return lines
}

const pageWriter = (pdf: PDFDocument, font: PDFFont, heading: string) => {
  let page: PDFPage
  let y = 0

  const nextPage = () => {
    page = pdf.addPage(PageSizes.A4)
    y = page.getHeight() - margin
  }

  const write = (text: string, size: number, leading: number) => {
    for (const line of wrapText(text, font, size, contentWidth)) {
      if (y < bottom) {
        nextPage()
      }

      page.drawText(line, { x: margin, y, font, size })
      y -= leading
    }
  }

  nextPage()
  write(heading, 22, 30)
  y -= 18

  return {
    paragraph: (text: string) => {
      write(text, bodySize, lineHeight)
      y -= 12
    },
  }
}

const stampPage = (page: PDFPage, font: PDFFont, number: number, original: boolean) => {
  const text = String(number)
  const size = 8
  const width = font.widthOfTextAtSize(text, size)

  if (!original) {
    page.drawText(appName, { x: margin, y: 24, font, size })
    page.drawText(text, { x: page.getWidth() - margin - width, y: 24, font, size })

    return
  }

  const crop = page.getCropBox()
  const rotation = ((page.getRotation().angle % 360) + 360) % 360

  const position = Match.value(rotation).pipe(
    Match.when(90, () => ({ x: crop.x + crop.width - 12, y: crop.y + crop.height - width - 12 })),
    Match.when(180, () => ({ x: crop.x + width + 12, y: crop.y + crop.height - 12 })),
    Match.when(270, () => ({ x: crop.x + 12, y: crop.y + width + 12 })),
    Match.orElse(() => ({ x: crop.x + crop.width - width - 12, y: crop.y + 12 })),
  )

  page.drawText(text, { ...position, rotate: degrees(rotation), font, size })
}

const writeCover = (
  merged: PDFDocument,
  font: PDFFont,
  documents: ReadonlyArray<PackageDocument>,
  { pathName, generationDate }: PackageDetails,
) => {
  const cover = pageWriter(merged, font, 'Pakiet dokumentów')
  cover.paragraph(pathName)
  cover.paragraph(`Data wygenerowania: ${generationDate}`)
  cover.paragraph('Wydania w pakiecie:')

  for (const document of documents) {
    cover.paragraph(`${document.title} — ${document.editionLabel}`)
  }
}

const writeContents = (
  merged: PDFDocument,
  font: PDFFont,
  documents: ReadonlyArray<PackageDocument>,
) => {
  const tocLines = documents.flatMap((document, index) =>
    wrapText(
      `${index + 1}. ${document.title} — ${document.editionLabel}`,
      font,
      bodySize,
      contentWidth - 48,
    ).map((text, line) => ({ text, index, first: line === 0 })),
  )

  const tocPages: Array<PDFPage> = []
  const tocTop = PageSizes.A4[1] - margin - 48
  const linesPerPage = Math.floor((tocTop - bottom) / lineHeight) + 1

  for (let index = 0; index < Math.max(1, Math.ceil(tocLines.length / linesPerPage)); index++) {
    const page = merged.addPage(PageSizes.A4)
    page.drawText('Spis treści', { x: margin, y: page.getHeight() - margin, font, size: 22 })
    tocPages.push(page)
  }

  return { tocPages, tocLines, tocTop, linesPerPage }
}

const writeDocumentTitle = (merged: PDFDocument, font: PDFFont, document: PackageDocument) => {
  const title = pageWriter(merged, font, document.title)
  title.paragraph(`Wydanie: ${document.editionLabel}`)
  title.paragraph(document.textKindLabel)
  title.paragraph(`Obowiązuje od: ${document.effectiveDate}`)
  title.paragraph(`Źródło: ${document.sourceUrl}`)
}

export const countPackagePages = ({
  documents,
  fontBytes,
  ...details
}: PackageDetails & {
  readonly documents: ReadonlyArray<PackageDocument & { readonly pageCount: number }>
  readonly fontBytes: Uint8Array
}) =>
  Effect.gen(function* () {
    if (documents.length === 0) {
      return 0
    }

    const pdf = yield* Effect.tryPromise({
      try: () => PDFDocument.create(),
      catch: cause => new PackageError({ cause }),
    })

    pdf.registerFontkit(fontkit)

    const font = yield* Effect.tryPromise({
      try: () => pdf.embedFont(fontBytes),
      catch: cause => new PackageError({ cause }),
    })

    writeCover(pdf, font, documents, details)
    writeContents(pdf, font, documents)

    for (const document of documents) {
      writeDocumentTitle(pdf, font, document)
    }

    return pdf.getPageCount() + documents.reduce((total, document) => total + document.pageCount, 0)
  })

export const mergePdfs = ({
  documents,
  pathName,
  generationDate,
  fontBytes,
}: PackageDetails & {
  readonly documents: ReadonlyArray<PackageFile>
  readonly fontBytes: Uint8Array
}) =>
  Effect.gen(function* () {
    const merged = yield* Effect.tryPromise({
      try: () => PDFDocument.create(),
      catch: cause => new PackageError({ cause }),
    })

    merged.registerFontkit(fontkit)

    const font = yield* Effect.tryPromise({
      try: () => merged.embedFont(fontBytes),
      catch: cause => new PackageError({ cause }),
    })

    merged.setTitle('Pakiet dokumentów')
    merged.setAuthor(appName)

    writeCover(merged, font, documents, { pathName, generationDate })
    const { tocPages, tocLines, tocTop, linesPerPage } = writeContents(merged, font, documents)

    const outline = merged.context.obj({ Type: 'Outlines', Count: documents.length })
    const outlineRef = merged.context.register(outline)

    const bookmarks = documents.map(document =>
      merged.context.obj({
        Title: PDFHexString.fromText(document.title),
        Parent: outlineRef,
      }),
    )

    const bookmarkRefs = bookmarks.map(bookmark => merged.context.register(bookmark))
    const starts: Array<number> = []
    const originalPages = new Set<PDFPage>()

    for (const [index, document] of documents.entries()) {
      const source = yield* Effect.tryPromise({
        try: () => PDFDocument.load(document.file),
        catch: cause => new PackageError({ cause }),
      })

      starts.push(merged.getPageCount() + 1)
      const titlePage = merged.getPageCount()
      writeDocumentTitle(merged, font, document)

      bookmarks[index]!.set(
        PDFName.of('Dest'),
        merged.context.obj([merged.getPage(titlePage).ref, 'Fit']),
      )

      if (index > 0) {
        bookmarks[index]!.set(PDFName.of('Prev'), bookmarkRefs[index - 1]!)
      }

      if (index < documents.length - 1) {
        bookmarks[index]!.set(PDFName.of('Next'), bookmarkRefs[index + 1]!)
      }

      const pages = yield* Effect.tryPromise({
        try: () => merged.copyPages(source, source.getPageIndices()),
        catch: cause => new PackageError({ cause }),
      })

      for (const page of pages) {
        merged.addPage(page)
        originalPages.add(page)
      }
    }

    for (const [index, line] of tocLines.entries()) {
      const page = tocPages[Math.floor(index / linesPerPage)]!
      const y = tocTop - (index % linesPerPage) * lineHeight
      page.drawText(line.text, { x: margin, y, font, size: bodySize })

      if (line.first) {
        const number = String(starts[line.index])
        page.drawText(number, {
          x: page.getWidth() - margin - font.widthOfTextAtSize(number, bodySize),
          y,
          font,
          size: bodySize,
        })
      }
    }

    if (bookmarkRefs.length > 0) {
      outline.set(PDFName.of('First'), bookmarkRefs[0]!)
      outline.set(PDFName.of('Last'), bookmarkRefs[bookmarkRefs.length - 1]!)
      merged.catalog.set(PDFName.of('Outlines'), outlineRef)
    }

    for (const [index, page] of merged.getPages().entries()) {
      stampPage(page, font, index + 1, originalPages.has(page))
    }

    return yield* Effect.tryPromise({
      try: () => merged.save(),
      catch: cause => new PackageError({ cause }),
    })
  })
