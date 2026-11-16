# Versioned rich content and renderer compatibility

Oral questions, oral answers, knowledge-check explanations and written explanations use Tiptap/ProseMirror JSON with an explicit versioned schema of supported elements rather than arbitrary JSON. Backend, editor and renderers share one content contract, so import compatibility can be checked and elements added without hidden differences between clients.

Images are stored in R2, and content references assets instead of embedding base64. Schema version 1 contains paragraphs, headings, lists, bold and italic, tables, quotes and an image node with an asset ID, alternative text and an optional caption. Asset metadata (storage key, media type, dimensions, size) has its own table from the start. Until file storage exists the backend returns no address for an asset, and renderers show an explicit placeholder with the alternative text. Later revisions may reuse an image; the backend provides its address and access according to the asset metadata.

An unsupported element never disappears silently. Renderers are tested against the shared specification, and adding elements accounts for supported client versions. Missing support requires an explicit fallback or message; the mechanism is chosen when the mobile renderer is designed. Full compatibility with V1 renderers is not assumed.

The schema lives in the universal `@inzpro/rich-content` package. Because the content format is itself the shared contract, API module models and rows use it directly instead of declaring their own copies as ADR-0027 otherwise requires; HTTP responses wrap it in `ResolvedRichContent` from `@inzpro/api-contracts`, which adds asset addresses.
