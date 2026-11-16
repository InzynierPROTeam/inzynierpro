import { ContentAssetId } from '@inzpro/domain/modules/learning-content/content-asset'
import { Schema } from 'effect'

export const richContentVersion = 1

export const boldMark = 'bold'
export const italicMark = 'italic'
export const richContentMarks = [boldMark, italicMark] as const

export const headingLevels = [2, 3, 4] as const

const Mark = Schema.Struct({ type: Schema.Literals(richContentMarks) })

export const Text = Schema.Struct({
  type: Schema.Literal('text'),
  text: Schema.NonEmptyString,
  marks: Schema.optionalKey(Schema.Array(Mark)),
})

export type Text = typeof Text.Type

const Inline = Schema.optionalKey(Schema.Array(Text))

export const Paragraph = Schema.Struct({ type: Schema.Literal('paragraph'), content: Inline })

export type Paragraph = typeof Paragraph.Type

export const Heading = Schema.Struct({
  type: Schema.Literal('heading'),
  attrs: Schema.Struct({ level: Schema.Literals(headingLevels) }),
  content: Inline,
})

export type Heading = typeof Heading.Type

export const Image = Schema.Struct({
  type: Schema.Literal('image'),
  attrs: Schema.Struct({
    assetId: ContentAssetId,
    alt: Schema.NonEmptyString,
    caption: Schema.NullOr(Schema.NonEmptyString),
  }),
})

export type Image = typeof Image.Type

export interface ListItem {
  readonly type: 'listItem'
  readonly content: ReadonlyArray<Block>
}

export interface BulletList {
  readonly type: 'bulletList'
  readonly content: ReadonlyArray<ListItem>
}

export interface OrderedList {
  readonly type: 'orderedList'
  readonly attrs?: { readonly start: number }
  readonly content: ReadonlyArray<ListItem>
}

export interface Blockquote {
  readonly type: 'blockquote'
  readonly content: ReadonlyArray<Block>
}

export interface TableCell {
  readonly type: 'tableCell' | 'tableHeader'
  readonly attrs?: { readonly colspan: number; readonly rowspan: number }
  readonly content: ReadonlyArray<Block>
}

export interface TableRow {
  readonly type: 'tableRow'
  readonly content: ReadonlyArray<TableCell>
}

export interface Table {
  readonly type: 'table'
  readonly content: ReadonlyArray<TableRow>
}

export type Block = Paragraph | Heading | Image | BulletList | OrderedList | Blockquote | Table

const nonEmpty = <S extends Schema.Top>(item: S) => Schema.Array(item).check(Schema.isMinLength(1))

const Blocks = nonEmpty(Schema.suspend((): Schema.Codec<Block, unknown> => Block))

const ListItem = Schema.Struct({ type: Schema.Literal('listItem'), content: Blocks })

const BulletList = Schema.Struct({
  type: Schema.Literal('bulletList'),
  content: nonEmpty(ListItem),
})

const PositiveInt = Schema.Int.check(Schema.isGreaterThan(0))

const OrderedList = Schema.Struct({
  type: Schema.Literal('orderedList'),
  attrs: Schema.optionalKey(Schema.Struct({ start: PositiveInt })),
  content: nonEmpty(ListItem),
})

const Blockquote = Schema.Struct({ type: Schema.Literal('blockquote'), content: Blocks })

const TableCell = Schema.Struct({
  type: Schema.Literals(['tableCell', 'tableHeader']),
  attrs: Schema.optionalKey(Schema.Struct({ colspan: PositiveInt, rowspan: PositiveInt })),
  content: Blocks,
})

const TableRow = Schema.Struct({ type: Schema.Literal('tableRow'), content: nonEmpty(TableCell) })

const Table = Schema.Struct({ type: Schema.Literal('table'), content: nonEmpty(TableRow) })

const Block: Schema.Codec<Block, unknown> = Schema.Union([
  Paragraph,
  Heading,
  Image,
  BulletList,
  OrderedList,
  Blockquote,
  Table,
])

export const RichContent = Schema.Struct({
  version: Schema.Literal(richContentVersion),
  doc: Schema.Struct({ type: Schema.Literal('doc'), content: Blocks }),
})

export type RichContent = typeof RichContent.Type

export const paragraphs = (text: string): RichContent => ({
  version: richContentVersion,
  doc: {
    type: 'doc',
    content: text
      .split(/\n\s*\n/)
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => ({ type: 'paragraph', content: [{ type: 'text', text: paragraph }] })),
  },
})

export interface AnyRichContentNode {
  readonly type: string
  readonly attrs?: { readonly [name: string]: Schema.Json }
  readonly content?: ReadonlyArray<AnyRichContentNode>
  readonly text?: string
  readonly marks?: ReadonlyArray<{ readonly type: string }>
}

export const AnyRichContentNode: Schema.Codec<AnyRichContentNode> = Schema.Struct({
  type: Schema.String,
  attrs: Schema.optionalKey(Schema.Record(Schema.String, Schema.Json)),
  content: Schema.optionalKey(Schema.Array(Schema.suspend(() => AnyRichContentNode))),
  text: Schema.optionalKey(Schema.String),
  marks: Schema.optionalKey(Schema.Array(Schema.Struct({ type: Schema.String }))),
})

export const AnyRichContent = Schema.Struct({ version: Schema.Int, doc: AnyRichContentNode })

export type AnyRichContent = typeof AnyRichContent.Type

const isImageNode = Schema.is(Image)

export const imageAssetIds = (content: AnyRichContent): ReadonlyArray<ContentAssetId> => {
  const ids = new Set<ContentAssetId>()

  const visit = (node: AnyRichContentNode) => {
    if (isImageNode(node)) {
      ids.add(node.attrs.assetId)
    }

    node.content?.forEach(visit)
  }

  visit(content.doc)

  return [...ids]
}
