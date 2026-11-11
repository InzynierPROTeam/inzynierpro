# Versioned rich content and renderer compatibility

Oral answers and explanations use Tiptap/ProseMirror JSON with an explicit versioned schema of supported elements rather than arbitrary JSON. Backend, editor and renderers share one content contract, so import compatibility can be checked and elements added without hidden differences between clients.

Images are stored in R2, and content references assets instead of embedding base64. Later revisions may reuse an image; the backend provides its address and access according to the asset metadata.

An unsupported element never disappears silently. Renderers are tested against the shared specification, and adding elements accounts for supported client versions. Missing support requires an explicit fallback or message; the mechanism is chosen when the mobile renderer is designed. Full compatibility with V1 renderers is not assumed.
