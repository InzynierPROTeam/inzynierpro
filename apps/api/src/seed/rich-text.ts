import { boldMark, italicMark, type Text } from '@inzpro/rich-content/rich-content'

export const plain = (text: string): Text => ({ type: 'text', text })

export const bold = (text: string): Text => ({ type: 'text', text, marks: [{ type: boldMark }] })

export const italic = (text: string): Text => ({
  type: 'text',
  text,
  marks: [{ type: italicMark }],
})
