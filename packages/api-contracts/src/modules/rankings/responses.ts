import { UserId } from '@inzpro/domain/modules/identity/user'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { RankingPosition } from '@inzpro/domain/modules/rankings/ranking'
import { Schema } from 'effect'

// CONTRACT: `profileVisible` is false only for another user's private profile; the viewer's own row is always true.
export const RankingEntry = Schema.Struct({
  position: RankingPosition,
  userId: UserId,
  name: Schema.String,
  image: Schema.NullOr(Schema.String),
  xp: LearningXp,
  profileVisible: Schema.Boolean,
})

export type RankingEntry = typeof RankingEntry.Type

// CONTRACT: `entries` holds at most the first 100 positions and is not paginated; `viewer` is the viewer's own row whether or not it appears in `entries`, null when the viewer has no XP in the period.
export const Ranking = Schema.Struct({
  entries: Schema.Array(RankingEntry),
  viewer: Schema.NullOr(RankingEntry),
})

export type Ranking = typeof Ranking.Type
