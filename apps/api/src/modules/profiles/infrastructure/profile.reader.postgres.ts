import { Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'

import { ProfileReadError } from '../application/errors.js'
import { ProfileReader } from '../application/profile.reader.js'
import { UserProfile } from '../domain/profile.model.js'

export const ProfileReaderLive = Layer.effect(
  ProfileReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return ProfileReader.of({
      profile: Effect.fn('ProfileReader.profile')(
        function* (userId) {
          const rows =
            yield* sql`SELECT id AS user_id,name,image,private_profile FROM users WHERE id=${userId} LIMIT 1`

          const [profile] = yield* Schema.decodeUnknownEffect(Schema.Array(UserProfile))(rows)

          return Option.fromNullishOr(profile)
        },
        Effect.mapError(cause => new ProfileReadError({ cause })),
      ),
    })
  }),
)
