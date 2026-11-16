# Rich content

How explanations and, later, oral answers are stored, validated and rendered. The decision is [ADR-0019](adr/0019-versioned-rich-content.md); the format lives in [`@inzpro/rich-content`](../packages/rich-content/README.md).

## Format

Content is Tiptap/ProseMirror JSON wrapped with its schema version: `{ "version": 1, "doc": { "type": "doc", "content": [...] } }`. An editor loads `doc` directly. Version 1 allows:

| Node                                            | Shape                                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `paragraph`                                     | Optional `text` content.                                                     |
| `heading`                                       | `attrs.level` 2, 3 or 4; the page and dialog titles own level 1.             |
| `text`                                          | Non-empty `text`, optional `marks` of `bold` and `italic`.                   |
| `bulletList`, `orderedList`                     | One or more `listItem`; an ordered list may set `attrs.start`.               |
| `listItem`, `blockquote`                        | One or more block nodes.                                                     |
| `table`, `tableRow`, `tableHeader`, `tableCell` | Rows of header or body cells; a cell may set `colspan` and `rowspan`.        |
| `image`                                         | `attrs.assetId`, non-empty `attrs.alt` and `attrs.caption` (text or `null`). |

Images reference a row of `content_assets` (storage key, media type, width, height, size in bytes). Content never embeds image data.

## Writing

Writes decode content with `Schema.decodeEffect(RichContent)`: unknown nodes and marks fail, and attributes outside the schema are not kept. The technical seed converts its plain-text explanations with `paragraphs` and decodes them the same way. Inside the write transaction the learning-content repository rejects an image whose asset is not stored (`UnknownContentAsset`). Content is stored as `jsonb`.

## Reading

Responses carry `ResolvedRichContent`: the stored content plus an `assets` list of `ContentAssetAddress`, each referenced asset's `url`. No file storage exists yet, so every `url` is `null`. The contract decodes content with the permissive `AnyRichContent`, so a client older than the content still receives it.

## Web renderer

`RichText` in `@inzpro/ui/components/rich-text` renders the nodes above inside `typeset typeset-docs`, so the shared [Typeset](https://ui.shadcn.com/docs/typeset) styles in `packages/ui/src/styles/typeset.css` lay out the HTML and every web client gets the same typography. Header rows go in `thead`, and tables sit in `typeset-scroll`. The renderer never drops content silently:

- an image without an address shows a placeholder with its alternative text, and its caption;
- an unknown node, or a known node with attributes it cannot use, shows "Ten fragment nie może zostać wyświetlony w tej wersji aplikacji." in its place, inline within a paragraph;
- text with an unknown mark keeps its text without that formatting.

The placeholder and the message carry `data-slot`, so Typeset leaves their own styles alone. The tests render the shared fixtures from `@inzpro/rich-content/fixtures`, one per node plus an unsupported node. A new renderer tests against the same fixtures, and adding a node adds a fixture.
