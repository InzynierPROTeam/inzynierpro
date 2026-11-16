# @inzpro/rich-content

The shared rich content format: a versioned Tiptap/ProseMirror JSON schema used by the backend, editors and renderers ([ADR-0019](../../docs/adr/0019-versioned-rich-content.md)). [docs/rich-content.md](../../docs/rich-content.md) describes the format and the web renderer.

**Runtime:** Universal JavaScript.

- `rich-content` holds `RichContent`, the version 1 schema every write decodes with, and `AnyRichContent`, the permissive shape renderers decode so that content from a newer schema still reaches them. It also has `paragraphs` for converting plain text and `imageAssetIds`.
- `fixtures` holds one valid document per node and an unsupported-node document. Every renderer tests against them.

It holds no React, no HTTP contracts and no asset storage: the contract that carries asset addresses is `ResolvedRichContent` in `@inzpro/api-contracts/modules/learning-content/responses`.

## Usage

```ts
import { RichContent } from '@inzpro/rich-content/rich-content'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
