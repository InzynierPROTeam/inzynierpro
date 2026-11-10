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
  yield* sql`CREATE TABLE written_questions (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    document_id uuid NOT NULL REFERENCES reference_documents(id),
    current_revision_id uuid,
    UNIQUE (id, document_id),
created_at timestamptz(3) NOT NULL DEFAULT now(),
updated_at timestamptz(3) NOT NULL DEFAULT now()
)`
  yield* sql`CREATE TRIGGER written_questions_updated_at BEFORE UPDATE ON written_questions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE question_revisions (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    question_id uuid NOT NULL REFERENCES written_questions(id),
    body text NOT NULL CHECK (length(body) > 0),
    explanation text NOT NULL CHECK (length(explanation) > 0),
    published_at timestamptz(3),
    withdrawn_at timestamptz(3),
    UNIQUE (question_id, id),
created_at timestamptz(3) NOT NULL DEFAULT now(),
updated_at timestamptz(3) NOT NULL DEFAULT now()
)`
  yield* sql`ALTER TABLE written_questions ADD CONSTRAINT written_questions_current_revision_fk
    FOREIGN KEY (id, current_revision_id) REFERENCES question_revisions(question_id, id)`
  yield* sql`CREATE TRIGGER question_revisions_updated_at BEFORE UPDATE ON question_revisions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE path_questions (
    qualification_path_id uuid NOT NULL,
    document_id uuid NOT NULL,
    question_id uuid NOT NULL,
    PRIMARY KEY (qualification_path_id, question_id),
    FOREIGN KEY (qualification_path_id, document_id) REFERENCES path_documents(qualification_path_id, document_id),
    FOREIGN KEY (question_id, document_id) REFERENCES written_questions(id, document_id),
created_at timestamptz(3) NOT NULL DEFAULT now(),
updated_at timestamptz(3) NOT NULL DEFAULT now()
)`
  yield* sql`CREATE TRIGGER path_questions_updated_at BEFORE UPDATE ON path_questions FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE question_answers (
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    question_revision_id uuid NOT NULL REFERENCES question_revisions(id) ON DELETE CASCADE,
    text text NOT NULL CHECK (length(text)>0),
    is_correct boolean NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(),
    updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE INDEX question_answers_revision_created_at_id_idx ON question_answers (question_revision_id,created_at,id)`
  yield* sql`CREATE UNIQUE INDEX question_answers_one_correct_per_revision ON question_answers (question_revision_id) WHERE is_correct`
  yield* sql`CREATE TRIGGER question_answers_updated_at BEFORE UPDATE ON question_answers FOR EACH ROW EXECUTE FUNCTION set_updated_at()`

  yield* sql`CREATE FUNCTION protect_question_answer() RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE
      parent_id uuid;
      publication timestamptz;
    BEGIN
      IF TG_OP='INSERT' THEN parent_id=NEW.question_revision_id;
      ELSE parent_id=OLD.question_revision_id; END IF;
      SELECT published_at INTO publication FROM question_revisions WHERE id=parent_id FOR UPDATE;
      IF publication IS NOT NULL THEN
        RAISE EXCEPTION 'Answers of published question revisions are immutable';
      END IF;
      IF TG_OP='UPDATE' AND NEW.question_revision_id IS DISTINCT FROM OLD.question_revision_id THEN
        RAISE EXCEPTION 'Question answer ownership cannot change';
      END IF;
      IF TG_OP='DELETE' THEN RETURN OLD; END IF;
      RETURN NEW;
    END;
  $$`
  yield* sql`CREATE TRIGGER question_answer_immutable BEFORE INSERT OR UPDATE OR DELETE ON question_answers FOR EACH ROW EXECUTE FUNCTION protect_question_answer()`

  yield* sql`CREATE FUNCTION protect_published_question_revision() RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE
      answer_count integer;
      correct_count integer;
    BEGIN
      IF TG_OP='DELETE' THEN
        IF OLD.published_at IS NOT NULL THEN RAISE EXCEPTION 'Published question revisions are immutable'; END IF;
        RETURN OLD;
      END IF;
      IF TG_OP='UPDATE' AND OLD.published_at IS NOT NULL AND
        (to_jsonb(NEW) - 'withdrawn_at' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'withdrawn_at' - 'updated_at') THEN
        RAISE EXCEPTION 'Published question revisions are immutable';
      END IF;
      IF NEW.published_at IS NOT NULL AND (TG_OP='INSERT' OR OLD.published_at IS NULL) THEN
        SELECT count(*),count(*) FILTER (WHERE is_correct) INTO answer_count,correct_count FROM question_answers WHERE question_revision_id=NEW.id;
        IF answer_count<>3 OR correct_count<>1 THEN RAISE EXCEPTION 'Published questions require three answers and exactly one correct answer'; END IF;
      END IF;
      RETURN NEW;
    END;
  $$`
  yield* sql`CREATE TRIGGER question_revision_immutable BEFORE INSERT OR UPDATE OR DELETE ON question_revisions FOR EACH ROW EXECUTE FUNCTION protect_published_question_revision()`
})
