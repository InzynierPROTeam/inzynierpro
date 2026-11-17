import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE oral_question_categories (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    name text NOT NULL CHECK (length(name) > 0),
    sort_order integer NOT NULL CHECK (sort_order >= 0),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER oral_question_categories_updated_at BEFORE UPDATE ON oral_question_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE oral_questions (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    category_id uuid NOT NULL REFERENCES oral_question_categories(id),
    category_position integer NOT NULL CHECK (category_position > 0),
    current_revision_id uuid,
    UNIQUE (category_id, category_position),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER oral_questions_updated_at BEFORE UPDATE ON oral_questions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE oral_revisions (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    question_id uuid NOT NULL REFERENCES oral_questions(id),
    body jsonb NOT NULL CHECK (jsonb_typeof(body)='object'),
    answer jsonb NOT NULL CHECK (jsonb_typeof(answer)='object'),
    published_at timestamptz(3),
    withdrawn_at timestamptz(3),
    withdrawal_reason text CHECK (length(withdrawal_reason) > 0),
    change_kind text NOT NULL CHECK (change_kind IN ('initial','cosmetic','substantive')),
    substantive_revision_id uuid NOT NULL,
    CHECK ((change_kind='cosmetic') = (substantive_revision_id<>id)),
    CHECK ((withdrawn_at IS NULL) = (withdrawal_reason IS NULL)),
    CHECK (withdrawn_at IS NULL OR published_at IS NOT NULL),
    UNIQUE (question_id, id),
    FOREIGN KEY (question_id, substantive_revision_id) REFERENCES oral_revisions(question_id, id),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`ALTER TABLE oral_questions ADD CONSTRAINT oral_questions_current_revision_fk
    FOREIGN KEY (id, current_revision_id) REFERENCES oral_revisions(question_id, id)`
  yield* sql`CREATE TRIGGER oral_revisions_updated_at BEFORE UPDATE ON oral_revisions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE path_oral_questions (
    qualification_path_id uuid NOT NULL REFERENCES qualification_paths(id),
    question_id uuid NOT NULL REFERENCES oral_questions(id),
    PRIMARY KEY (qualification_path_id, question_id),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER path_oral_questions_updated_at BEFORE UPDATE ON path_oral_questions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE oral_question_regional_links (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    question_id uuid NOT NULL REFERENCES oral_questions(id),
    district_chamber_id uuid NOT NULL REFERENCES district_chambers(id),
    source_kind text NOT NULL CHECK (source_kind IN ('recollection','official')),
    recorded_at timestamptz(3) NOT NULL,
    UNIQUE (question_id, district_chamber_id, source_kind, recorded_at),
    created_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE INDEX oral_question_regional_links_chamber_question ON oral_question_regional_links (district_chamber_id, question_id)`

  yield* sql`CREATE FUNCTION protect_published_oral_revision() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF TG_OP='DELETE' THEN
        IF OLD.published_at IS NOT NULL THEN RAISE EXCEPTION 'Published oral revisions are immutable'; END IF;
        RETURN OLD;
      END IF;
      IF OLD.published_at IS NOT NULL AND
        (to_jsonb(NEW) - 'withdrawn_at' - 'withdrawal_reason' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'withdrawn_at' - 'withdrawal_reason' - 'updated_at') THEN
        RAISE EXCEPTION 'Published oral revisions are immutable';
      END IF;
      IF OLD.withdrawn_at IS NOT NULL AND
        (NEW.withdrawn_at,NEW.withdrawal_reason) IS DISTINCT FROM (OLD.withdrawn_at,OLD.withdrawal_reason) THEN
        RAISE EXCEPTION 'Oral revision withdrawals are final';
      END IF;
      RETURN NEW;
    END;
  $$`
  yield* sql`CREATE TRIGGER oral_revision_immutable BEFORE UPDATE OR DELETE ON oral_revisions FOR EACH ROW EXECUTE FUNCTION protect_published_oral_revision()`
})
