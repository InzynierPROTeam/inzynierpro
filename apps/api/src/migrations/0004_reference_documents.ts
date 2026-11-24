import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE content_assets (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    storage_key text NOT NULL UNIQUE CHECK (length(storage_key) > 0),
    media_type text NOT NULL CHECK (media_type IN ('image/png','image/jpeg','image/webp','application/pdf')),
    width integer CHECK (width > 0),
    height integer CHECK (height > 0),
    size_bytes integer NOT NULL CHECK (size_bytes > 0),
    CHECK (CASE WHEN media_type = 'application/pdf' THEN width IS NULL AND height IS NULL ELSE width IS NOT NULL AND height IS NOT NULL END),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER content_assets_updated_at BEFORE UPDATE ON content_assets FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE reference_documents (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    kind text NOT NULL CHECK (kind IN ('statute','regulation','standard','code','manual','guideline')),
    code text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(code) <= 80),
    abbreviation text NOT NULL CHECK (length(abbreviation) > 0),
    title text NOT NULL,
    description text CHECK (length(description) > 0),
    current_edition_id uuid,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER reference_documents_updated_at BEFORE UPDATE ON reference_documents FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE document_editions (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    document_id uuid NOT NULL REFERENCES reference_documents(id),
    label text NOT NULL CHECK (length(label) > 0),
    text_kind text NOT NULL CHECK (text_kind IN ('official_consolidated','editorial_consolidation','original')),
    effective_from timestamptz(3) NOT NULL,
    external_url text NOT NULL CHECK (external_url ~ '^https?://[^[:space:]]+$'),
    pdf_asset_id uuid REFERENCES content_assets(id),
    availability text NOT NULL CHECK (availability IN ('full_content','pdf_only','metadata_only')),
    downloadable boolean NOT NULL DEFAULT false,
    published_at timestamptz(3),
    UNIQUE (id, document_id),
    CHECK (availability <> 'pdf_only' OR pdf_asset_id IS NOT NULL),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER document_editions_updated_at BEFORE UPDATE ON document_editions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`ALTER TABLE reference_documents ADD FOREIGN KEY (current_edition_id, id) REFERENCES document_editions(id, document_id)`
  yield* sql`CREATE TABLE path_documents (
    qualification_path_id uuid NOT NULL REFERENCES qualification_paths(id),
    document_id uuid NOT NULL REFERENCES reference_documents(id),
    PRIMARY KEY (qualification_path_id, document_id),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER path_documents_updated_at BEFORE UPDATE ON path_documents FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
})
