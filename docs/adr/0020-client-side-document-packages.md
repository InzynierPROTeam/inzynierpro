# Client-side document packages

R2 stores the base PDFs of specific approved document editions. The web client downloads the selected documents and assembles a package in the chosen order with extras, so the backend stores no per-user variants. This limits stored files and matches the proven V1 flow. The result keeps edition and source labels: each document gets a title page with its edition, text kind, effective date and source, and the file has a table of contents and one PDF bookmark per document. Original pages stay untouched apart from a small page number, so the legal text carries no branding. Assembly uses `pdf-lib` in a Web Worker and draws our own pages directly, without a separate PDF rendering library. Selection and order are a per-device convenience stored locally, never on the server.

Initial personalization covers choosing documents and extras, not changing the typesetting of a statute; changing fonts or margins would require rendering from structured content and is a later extension. Preparing a correct approved edition stays separate from assembling a package locally. A large package is tested on a weaker device before choosing how computation runs; the mobile approach is decided with the mobile client.

A package of available documents can be downloaded even when some syllabus items have no published PDF. Missing documents are shown in the UI before download, and the file, including its table of contents, contains only included documents.

A failed download of a selected file is never skipped silently. The selection is kept and the user may retry or deliberately remove the document.
