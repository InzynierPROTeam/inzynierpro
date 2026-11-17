import type { Block, TableCell } from '@inzpro/rich-content/rich-content'
import { boldMark, italicMark, type Text } from '@inzpro/rich-content/rich-content'

export const plain = (text: string): Text => ({ type: 'text', text })

export const bold = (text: string): Text => ({ type: 'text', text, marks: [{ type: boldMark }] })

export const italic = (text: string): Text => ({
  type: 'text',
  text,
  marks: [{ type: italicMark }],
})

export const paragraph = (...content: ReadonlyArray<Text>): Block => ({
  type: 'paragraph',
  content,
})

export const heading = (value: string): Block => ({
  type: 'heading',
  attrs: { level: 3 },
  content: [plain(value)],
})

export const listItems = (items: ReadonlyArray<ReadonlyArray<Text>>) =>
  items.map(item => ({ type: 'listItem' as const, content: [paragraph(...item)] }))

export const bulletList = (...items: ReadonlyArray<ReadonlyArray<Text>>): Block => ({
  type: 'bulletList',
  content: listItems(items),
})

export const orderedList = (...items: ReadonlyArray<ReadonlyArray<Text>>): Block => ({
  type: 'orderedList',
  content: listItems(items),
})

export const cell = (type: TableCell['type'], value: string): TableCell => ({
  type,
  content: [paragraph(plain(value))],
})

export const table = (
  header: ReadonlyArray<string>,
  ...rows: ReadonlyArray<ReadonlyArray<string>>
): Block => ({
  type: 'table',
  content: [
    { type: 'tableRow', content: header.map(value => cell('tableHeader', value)) },
    ...rows.map(row => ({
      type: 'tableRow' as const,
      content: row.map(value => cell('tableCell', value)),
    })),
  ],
})
