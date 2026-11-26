import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`CREATE TABLE chamber_offices (
    id uuid PRIMARY KEY,
    general_chamber_id uuid REFERENCES general_chambers(id),
    district_chamber_id uuid REFERENCES district_chambers(id),
    name text NOT NULL, address text NOT NULL, is_primary boolean NOT NULL DEFAULT false,
    opening_hours text, sort_order integer NOT NULL, published boolean NOT NULL DEFAULT false,
    source_url text NOT NULL, checked_at timestamptz(3) NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(), updated_at timestamptz(3) NOT NULL DEFAULT now(),
    CHECK ((general_chamber_id IS NOT NULL) <> (district_chamber_id IS NOT NULL))
  )`
  yield* sql`CREATE INDEX chamber_offices_general ON chamber_offices(general_chamber_id)`
  yield* sql`CREATE INDEX chamber_offices_district ON chamber_offices(district_chamber_id)`
  yield* sql`CREATE TRIGGER chamber_offices_updated_at BEFORE UPDATE ON chamber_offices FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE chamber_office_phones (
    id uuid PRIMARY KEY, office_id uuid NOT NULL REFERENCES chamber_offices(id) ON DELETE CASCADE,
    value text NOT NULL, label text, sort_order integer NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(), updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE INDEX chamber_office_phones_office ON chamber_office_phones(office_id)`
  yield* sql`CREATE TRIGGER chamber_office_phones_updated_at BEFORE UPDATE ON chamber_office_phones FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE chamber_office_emails (
    id uuid PRIMARY KEY, office_id uuid NOT NULL REFERENCES chamber_offices(id) ON DELETE CASCADE,
    value text NOT NULL, label text, sort_order integer NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(), updated_at timestamptz(3) NOT NULL DEFAULT now()
  )`
  yield* sql`CREATE INDEX chamber_office_emails_office ON chamber_office_emails(office_id)`
  yield* sql`CREATE TRIGGER chamber_office_emails_updated_at BEFORE UPDATE ON chamber_office_emails FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  yield* sql`CREATE TABLE chamber_websites (
    id uuid PRIMARY KEY, general_chamber_id uuid REFERENCES general_chambers(id),
    district_chamber_id uuid REFERENCES district_chambers(id),
    url text NOT NULL, label text, kind text NOT NULL CHECK (kind IN ('website','bip','facebook','linkedin','other')),
    sort_order integer NOT NULL, published boolean NOT NULL DEFAULT false,
    source_url text NOT NULL, checked_at timestamptz(3) NOT NULL,
    created_at timestamptz(3) NOT NULL DEFAULT now(), updated_at timestamptz(3) NOT NULL DEFAULT now(),
    CHECK ((general_chamber_id IS NOT NULL) <> (district_chamber_id IS NOT NULL))
  )`
  yield* sql`CREATE INDEX chamber_websites_general ON chamber_websites(general_chamber_id)`
  yield* sql`CREATE INDEX chamber_websites_district ON chamber_websites(district_chamber_id)`
  yield* sql`CREATE TRIGGER chamber_websites_updated_at BEFORE UPDATE ON chamber_websites FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
})
