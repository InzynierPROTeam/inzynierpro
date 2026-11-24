import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE question_references (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    written_revision_id uuid REFERENCES question_revisions(id),
    oral_revision_id uuid REFERENCES oral_revisions(id),
    position integer NOT NULL CHECK (position > 0),
    document_id uuid NOT NULL REFERENCES reference_documents(id),
    address text CHECK (address ~ '^[a-z]+:[0-9a-z]+(/[a-z]+:[0-9a-z]+)*$'),
    pdf_page integer CHECK (pdf_page > 0),
    kind text NOT NULL CHECK (kind IN ('direct_basis','aid','topic')),
    is_critical boolean NOT NULL DEFAULT false,
    verified_edition_id uuid,
    CHECK (num_nonnulls(written_revision_id, oral_revision_id) = 1),
    CHECK (num_nonnulls(address, pdf_page) <= 1),
    FOREIGN KEY (verified_edition_id, document_id) REFERENCES document_editions(id, document_id),
    UNIQUE (written_revision_id, position),
    UNIQUE (oral_revision_id, position),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE INDEX question_references_document_address_idx ON question_references (document_id, address)`
  yield* sql`CREATE TRIGGER question_references_updated_at BEFORE UPDATE ON question_references FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE FUNCTION protect_question_reference() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM question_revisions WHERE published_at IS NOT NULL AND id IN (OLD.written_revision_id, NEW.written_revision_id)
        UNION ALL
        SELECT 1 FROM oral_revisions WHERE published_at IS NOT NULL AND id IN (OLD.oral_revision_id, NEW.oral_revision_id)
      ) THEN
        RAISE EXCEPTION 'References of published question revisions are immutable';
      END IF;
      IF TG_OP='DELETE' THEN RETURN OLD; END IF;
      RETURN NEW;
    END;
  $$`
  yield* sql`CREATE TRIGGER question_reference_immutable BEFORE INSERT OR UPDATE OR DELETE ON question_references FOR EACH ROW EXECUTE FUNCTION protect_question_reference()`
})
