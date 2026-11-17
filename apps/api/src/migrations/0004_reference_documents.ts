import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE reference_documents (id uuid PRIMARY KEY DEFAULT uuidv7(), title text NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER reference_documents_updated_at BEFORE UPDATE ON reference_documents FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE path_documents (
    qualification_path_id uuid NOT NULL REFERENCES qualification_paths(id),
    document_id uuid NOT NULL REFERENCES reference_documents(id),
    PRIMARY KEY (qualification_path_id, document_id),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER path_documents_updated_at BEFORE UPDATE ON path_documents FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE content_assets (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    storage_key text NOT NULL UNIQUE CHECK (length(storage_key) > 0),
    media_type text NOT NULL CHECK (media_type IN ('image/png','image/jpeg','image/webp')),
    width integer NOT NULL CHECK (width > 0),
    height integer NOT NULL CHECK (height > 0),
    size_bytes integer NOT NULL CHECK (size_bytes > 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER content_assets_updated_at BEFORE UPDATE ON content_assets FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
})
