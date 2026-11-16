import {
  type AnyRichContent,
  type AnyRichContentNode,
  boldMark,
  Heading,
  Image,
  italicMark,
} from '@inzpro/rich-content/rich-content'
import { Schema } from 'effect'
import { ImageOff, TriangleAlert } from 'lucide-react'
import React from 'react'
import { cx } from 'tailwind-variants'

type RichTextAsset = { readonly id: string; readonly url: string | null }

type RichTextProps = {
  content: AnyRichContent
  assets: ReadonlyArray<RichTextAsset>
}

const isImage = Schema.is(Image)
const isHeadingAttrs = Schema.is(Heading.fields.attrs)
const isPositiveInteger = Schema.is(Schema.Int.check(Schema.isGreaterThan(0)))

const headingTags = { 2: 'h2', 3: 'h3', 4: 'h4' } as const

const positiveInteger = (value: Schema.Json | undefined) =>
  isPositiveInteger(value) ? value : undefined

type UnsupportedNodeProps = { inline?: boolean }

const UnsupportedNode: React.FC<UnsupportedNodeProps> = ({ inline = false }) => {
  const Message = inline ? 'span' : 'p'

  return (
    <Message
      data-slot="rich-text-unsupported"
      className={cx(
        'text-muted-foreground items-center gap-2 rounded-md border border-dashed text-sm',
        inline ? 'inline-flex px-1' : 'flex px-3 py-2',
      )}
    >
      <TriangleAlert className="size-4 shrink-0" />
      Ten fragment nie może zostać wyświetlony w tej wersji aplikacji.
    </Message>
  )
}

type ContentImageProps = { image: Image; asset: RichTextAsset | undefined }

const ContentImage: React.FC<ContentImageProps> = ({ image: { attrs }, asset }) => (
  <figure>
    {asset?.url ? (
      <img
        src={asset.url}
        alt={attrs.alt}
      />
    ) : (
      <div
        role="img"
        aria-label={attrs.alt}
        data-slot="rich-text-image-placeholder"
        className="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed px-3 py-6 text-sm"
      >
        <ImageOff className="size-4 shrink-0" />
        <span aria-hidden>Obraz niedostępny: {attrs.alt}</span>
      </div>
    )}
    {attrs.caption !== null && <figcaption>{attrs.caption}</figcaption>}
  </figure>
)

const renderText = (node: AnyRichContentNode, key: number): React.ReactNode => {
  const marks = new Set(node.marks?.map(mark => mark.type))
  let text: React.ReactNode = node.text

  if (marks.has(italicMark)) {
    text = <em>{text}</em>
  }

  if (marks.has(boldMark)) {
    text = <strong>{text}</strong>
  }

  return <React.Fragment key={key}>{text}</React.Fragment>
}

const isHeaderRow = (row: AnyRichContentNode) =>
  row.content !== undefined &&
  row.content.length > 0 &&
  row.content.every(cell => cell.type === 'tableHeader')

const renderNodes = (
  nodes: ReadonlyArray<AnyRichContentNode> | undefined,
  assets: ReadonlyArray<RichTextAsset>,
  inline = false,
): React.ReactNode => nodes?.map((node, index) => renderNode(node, index, assets, inline))

const renderTable = (
  table: AnyRichContentNode,
  key: number,
  assets: ReadonlyArray<RichTextAsset>,
): React.ReactNode => {
  const rows = table.content ?? []
  const headerCount = rows.findIndex(row => !isHeaderRow(row))
  const headerRows = headerCount === -1 ? rows : rows.slice(0, headerCount)
  const bodyRows = headerCount === -1 ? [] : rows.slice(headerCount)

  return (
    <div
      key={key}
      className="typeset-scroll"
    >
      <table>
        {headerRows.length > 0 && <thead>{renderNodes(headerRows, assets)}</thead>}
        {bodyRows.length > 0 && <tbody>{renderNodes(bodyRows, assets)}</tbody>}
      </table>
    </div>
  )
}

const renderNode = (
  node: AnyRichContentNode,
  key: number,
  assets: ReadonlyArray<RichTextAsset>,
  inline: boolean,
): React.ReactNode => {
  if (inline && node.type !== 'text') {
    return (
      <UnsupportedNode
        key={key}
        inline
      />
    )
  }

  const hasInlineContent = node.type === 'paragraph' || node.type === 'heading'
  const children = renderNodes(node.content, assets, hasInlineContent)

  switch (node.type) {
    case 'text':
      return node.text !== undefined ? (
        renderText(node, key)
      ) : (
        <UnsupportedNode
          key={key}
          inline={inline}
        />
      )
    case 'paragraph':
      return <p key={key}>{children}</p>
    case 'heading': {
      if (!isHeadingAttrs(node.attrs)) {
        return <UnsupportedNode key={key} />
      }

      const HeadingTag = headingTags[node.attrs.level]

      return <HeadingTag key={key}>{children}</HeadingTag>
    }

    case 'bulletList':
      return <ul key={key}>{children}</ul>
    case 'orderedList':
      return (
        <ol
          key={key}
          start={positiveInteger(node.attrs?.['start'])}
        >
          {children}
        </ol>
      )
    case 'listItem':
      return <li key={key}>{children}</li>
    case 'blockquote':
      return <blockquote key={key}>{children}</blockquote>
    case 'table':
      return renderTable(node, key, assets)
    case 'tableRow':
      return <tr key={key}>{children}</tr>
    case 'tableHeader':
    case 'tableCell': {
      const Cell = node.type === 'tableHeader' ? 'th' : 'td'

      return (
        <Cell
          key={key}
          colSpan={positiveInteger(node.attrs?.['colspan'])}
          rowSpan={positiveInteger(node.attrs?.['rowspan'])}
        >
          {children}
        </Cell>
      )
    }

    case 'image':
      return isImage(node) ? (
        <ContentImage
          key={key}
          image={node}
          asset={assets.find(asset => asset.id === node.attrs.assetId)}
        />
      ) : (
        <UnsupportedNode key={key} />
      )
    default:
      return <UnsupportedNode key={key} />
  }
}

export const RichText: React.FC<RichTextProps> = ({ content, assets }) => (
  <div className="typeset typeset-docs">
    {content.doc.type === 'doc' ? renderNodes(content.doc.content, assets) : <UnsupportedNode />}
  </div>
)
