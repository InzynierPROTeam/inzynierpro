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

Responses carry `ResolvedRichContent`: the stored content plus an `assets` list of `ContentAssetAddress`, each referenced asset's `url`. Files live in a private S3-compatible bucket behind the learning-content `FileStorage` port (ADR-0017): MinIO locally and in tests, Cloudflare R2 when deployed. The S3 adapter uses only `PutObject` and presigned `GetObject`, both supported by R2.

A handler signs addresses only after its read has authorized the content: path access, and published or session content the learner may see. Mappers stay pure and take the addresses as an argument; the handler wraps them with `withContentAssetAddresses(contentsOf, toDto)`, so one response signs once. `signContentAssetAddresses` collects the image asset IDs of the returned content (for a quiz check, only once it is answered), reads their storage keys in one query and signs a `GET` address valid for one hour. An asset without a stored row keeps `url: null`; when the addresses cannot be signed, the response keeps every `url` `null` and the API logs a warning, so the content stays readable with placeholders. The contract decodes content with the permissive `AnyRichContent`, so a client older than the content still receives it.

There is no upload API yet. The technical seed uploads its diagram from `apps/api/src/seed/assets` and records it in `content_assets`.

## Web renderer

`RichText` in `@inzpro/ui/components/rich-text` renders the nodes above inside `typeset typeset-docs`, so the shared [Typeset](https://ui.shadcn.com/docs/typeset) styles in `packages/ui/src/styles/typeset.css` lay out the HTML and every web client gets the same typography. Header rows go in `thead`, and tables sit in `typeset-scroll`. The renderer never drops content silently:

- an image without an address shows a placeholder with its alternative text, and its caption;
- an unknown node, or a known node with attributes it cannot use, shows "Ten fragment nie może zostać wyświetlony w tej wersji aplikacji." in its place, inline within a paragraph;
- text with an unknown mark keeps its text without that formatting.

The placeholder and the message carry `data-slot`, so Typeset leaves their own styles alone. The tests render the shared fixtures from `@inzpro/rich-content/fixtures`, one per node plus an unsupported node. A new renderer tests against the same fixtures, and adding a node adds a fixture.
