import { PDFDocument } from 'pdf-lib'
import { expect, test } from 'vitest'

import { mergePdfs } from './merge-pdfs'

const fixturePdf = async (title: string, pageCount: number) => {
  const document = await PDFDocument.create()
  document.setTitle(title)

  for (let page = 0; page < pageCount; page++) {
    document.addPage([200 + page, 300])
  }

  return document.save()
}

test('the merged file holds the original pages of every document in the chosen order', async () => {
  const merged = await PDFDocument.load(
    await mergePdfs([await fixturePdf('first', 2), await fixturePdf('second', 3)]),
  )

  expect(merged.getPages().map(page => page.getWidth())).toEqual([200, 201, 200, 201, 202])
})

test('a file that is not a PDF stops the merge', async () => {
  await expect(
    mergePdfs([await fixturePdf('first', 1), new TextEncoder().encode('<html></html>')]),
  ).rejects.toThrow()
})
