import { PDFDocument } from 'pdf-lib'

export const mergePdfs = async (files: ReadonlyArray<Uint8Array>) => {
  const merged = await PDFDocument.create()

  for (const file of files) {
    const source = await PDFDocument.load(file)
    const pages = await merged.copyPages(source, source.getPageIndices())

    pages.forEach(page => merged.addPage(page))
  }

  return merged.save()
}
