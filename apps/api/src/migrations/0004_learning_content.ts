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
    explanation jsonb NOT NULL CHECK (jsonb_typeof(explanation)='object'),
    published_at timestamptz(3),
    withdrawn_at timestamptz(3),
    withdrawal_reason text CHECK (length(withdrawal_reason) > 0),
    change_kind text NOT NULL CHECK (change_kind IN ('initial','cosmetic','substantive')),
    substantive_revision_id uuid NOT NULL,
    CHECK ((change_kind='cosmetic') = (substantive_revision_id<>id)),
    CHECK ((withdrawn_at IS NULL) = (withdrawal_reason IS NULL)),
    CHECK (withdrawn_at IS NULL OR published_at IS NOT NULL),
    UNIQUE (question_id, id),
    FOREIGN KEY (question_id, substantive_revision_id) REFERENCES question_revisions(question_id, id),
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
    updated_at timestamptz(3) NOT NULL DEFAULT now(),
    UNIQUE (question_revision_id, id)
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
        (to_jsonb(NEW) - 'withdrawn_at' - 'withdrawal_reason' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'withdrawn_at' - 'withdrawal_reason' - 'updated_at') THEN
        RAISE EXCEPTION 'Published question revisions are immutable';
      END IF;
      IF TG_OP='UPDATE' AND OLD.withdrawn_at IS NOT NULL AND
        (NEW.withdrawn_at,NEW.withdrawal_reason) IS DISTINCT FROM (OLD.withdrawn_at,OLD.withdrawal_reason) THEN
        RAISE EXCEPTION 'Question revision withdrawals are final';
      END IF;
      IF NEW.published_at IS NOT NULL AND (TG_OP='INSERT' OR OLD.published_at IS NULL) THEN
        SELECT count(*),count(*) FILTER (WHERE is_correct) INTO answer_count,correct_count FROM question_answers WHERE question_revision_id=NEW.id;
        IF answer_count<>3 OR correct_count<>1 THEN RAISE EXCEPTION 'Published questions require three answers and exactly one correct answer'; END IF;
      END IF;
      RETURN NEW;
    END;
  $$`
  yield* sql`CREATE TRIGGER question_revision_immutable BEFORE INSERT OR UPDATE OR DELETE ON question_revisions FOR EACH ROW EXECUTE FUNCTION protect_published_question_revision()`
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
