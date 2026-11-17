import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE oral_knowledge_checks (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    question_id uuid NOT NULL REFERENCES oral_questions(id),
    current_revision_id uuid,
    UNIQUE (id, question_id),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER oral_knowledge_checks_updated_at BEFORE UPDATE ON oral_knowledge_checks FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE oral_knowledge_check_revisions (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    knowledge_check_id uuid NOT NULL,
    question_id uuid NOT NULL,
    oral_revision_id uuid NOT NULL,
    format text NOT NULL CHECK (format IN ('single_choice','true_false','multiple_choice')),
    prompt text NOT NULL CHECK (length(prompt) > 0),
    explanation jsonb NOT NULL CHECK (jsonb_typeof(explanation)='object'),
    published_at timestamptz(3),
    UNIQUE (knowledge_check_id, id),
    FOREIGN KEY (knowledge_check_id, question_id) REFERENCES oral_knowledge_checks(id, question_id),
    FOREIGN KEY (question_id, oral_revision_id) REFERENCES oral_revisions(question_id, id),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE INDEX oral_knowledge_check_revisions_oral_revision ON oral_knowledge_check_revisions (oral_revision_id)`
  yield* sql`ALTER TABLE oral_knowledge_checks ADD CONSTRAINT oral_knowledge_checks_current_revision_fk
    FOREIGN KEY (id, current_revision_id) REFERENCES oral_knowledge_check_revisions(knowledge_check_id, id)`
  yield* sql`CREATE TRIGGER oral_knowledge_check_revisions_updated_at BEFORE UPDATE ON oral_knowledge_check_revisions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE oral_knowledge_check_options (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    knowledge_check_revision_id uuid NOT NULL REFERENCES oral_knowledge_check_revisions(id) ON DELETE CASCADE,
    option_position smallint NOT NULL CHECK (option_position > 0),
    text text NOT NULL CHECK (length(text) > 0),
    is_correct boolean NOT NULL,
    UNIQUE (knowledge_check_revision_id, option_position),
    UNIQUE (knowledge_check_revision_id, id),
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE TRIGGER oral_knowledge_check_options_updated_at BEFORE UPDATE ON oral_knowledge_check_options FOR EACH ROW EXECUTE FUNCTION set_updated_at()`

  yield* sql`CREATE FUNCTION protect_oral_knowledge_check_option() RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE
      parent_id uuid;
      publication timestamptz;
    BEGIN
      IF TG_OP='INSERT' THEN parent_id=NEW.knowledge_check_revision_id;
      ELSE parent_id=OLD.knowledge_check_revision_id; END IF;
      SELECT published_at INTO publication FROM oral_knowledge_check_revisions WHERE id=parent_id FOR UPDATE;
      IF publication IS NOT NULL THEN
        RAISE EXCEPTION 'Options of published knowledge check revisions are immutable';
      END IF;
      IF TG_OP='UPDATE' AND NEW.knowledge_check_revision_id IS DISTINCT FROM OLD.knowledge_check_revision_id THEN
        RAISE EXCEPTION 'Knowledge check option ownership cannot change';
      END IF;
      IF TG_OP='DELETE' THEN RETURN OLD; END IF;
      RETURN NEW;
    END;
  $$`
  yield* sql`CREATE TRIGGER oral_knowledge_check_option_immutable BEFORE INSERT OR UPDATE OR DELETE ON oral_knowledge_check_options FOR EACH ROW EXECUTE FUNCTION protect_oral_knowledge_check_option()`

  yield* sql`CREATE FUNCTION protect_published_oral_knowledge_check_revision() RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE
      option_count integer;
      correct_count integer;
    BEGIN
      IF TG_OP='DELETE' THEN
        IF OLD.published_at IS NOT NULL THEN RAISE EXCEPTION 'Published knowledge check revisions are immutable'; END IF;
        RETURN OLD;
      END IF;
      IF TG_OP='UPDATE' AND OLD.published_at IS NOT NULL AND
        (to_jsonb(NEW) - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'updated_at') THEN
        RAISE EXCEPTION 'Published knowledge check revisions are immutable';
      END IF;
      IF NEW.published_at IS NOT NULL AND (TG_OP='INSERT' OR OLD.published_at IS NULL) THEN
        SELECT count(*),count(*) FILTER (WHERE is_correct) INTO option_count,correct_count
          FROM oral_knowledge_check_options WHERE knowledge_check_revision_id=NEW.id;
        IF NEW.format='true_false' AND (option_count<>2 OR correct_count<>1) THEN
          RAISE EXCEPTION 'Published true/false checks require two options and exactly one correct option';
        END IF;
        IF NEW.format='single_choice' AND (option_count<>3 OR correct_count<>1) THEN
          RAISE EXCEPTION 'Published single-choice checks require three options and exactly one correct option';
        END IF;
        IF NEW.format='multiple_choice' AND (option_count<>4 OR correct_count<1) THEN
          RAISE EXCEPTION 'Published multiple-choice checks require four options and at least one correct option';
        END IF;
      END IF;
      RETURN NEW;
    END;
  $$`
  yield* sql`CREATE TRIGGER oral_knowledge_check_revision_immutable BEFORE INSERT OR UPDATE OR DELETE ON oral_knowledge_check_revisions FOR EACH ROW EXECUTE FUNCTION protect_published_oral_knowledge_check_revision()`
})
