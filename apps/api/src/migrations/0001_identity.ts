import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

// Tables owned by Identity & Access and accessed by Better Auth through its official
// PostgreSQL adapter. Column names are mapped in @inzpro/auth.
export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      name text NOT NULL,
      email text NOT NULL,
      email_verified boolean NOT NULL DEFAULT false,
      image text,
      created_at timestamptz(3) NOT NULL DEFAULT now(),
      updated_at timestamptz(3) NOT NULL DEFAULT now(),
      CONSTRAINT users_email_key UNIQUE (email),
      CONSTRAINT users_email_normalized CHECK (email = lower(email))
    )
  `

  yield* sql`
    CREATE TABLE auth_sessions (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      token text NOT NULL,
      expires_at timestamptz(3) NOT NULL,
      ip_address text,
      user_agent text,
      created_at timestamptz(3) NOT NULL DEFAULT now(),
      updated_at timestamptz(3) NOT NULL DEFAULT now(),
      CONSTRAINT auth_sessions_token_key UNIQUE (token)
    )
  `

  yield* sql`CREATE INDEX auth_sessions_user_id_idx ON auth_sessions (user_id)`

  yield* sql`
    CREATE TABLE auth_accounts (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      account_id text NOT NULL,
      provider_id text NOT NULL,
      access_token text,
      refresh_token text,
      id_token text,
      access_token_expires_at timestamptz(3),
      refresh_token_expires_at timestamptz(3),
      scope text,
      password text,
      created_at timestamptz(3) NOT NULL DEFAULT now(),
      updated_at timestamptz(3) NOT NULL DEFAULT now(),
      CONSTRAINT auth_accounts_provider_account_key UNIQUE (provider_id, account_id)
    )
  `

  yield* sql`CREATE INDEX auth_accounts_user_id_idx ON auth_accounts (user_id)`

  yield* sql`
    CREATE TABLE auth_verifications (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      identifier text NOT NULL,
      value text NOT NULL,
      expires_at timestamptz(3) NOT NULL,
      created_at timestamptz(3) NOT NULL DEFAULT now(),
      updated_at timestamptz(3) NOT NULL DEFAULT now()
    )
  `

  yield* sql`CREATE INDEX auth_verifications_identifier_idx ON auth_verifications (identifier)`
})
