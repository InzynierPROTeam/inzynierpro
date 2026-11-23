import { UserId } from '@inzpro/domain/modules/identity/user'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { RankingPosition } from '@inzpro/domain/modules/rankings/ranking'
import { type Option, Schema } from 'effect'

export const RankedUser = Schema.Struct({
  position: RankingPosition,
  userId: UserId,
  name: Schema.String,
  image: Schema.OptionFromNullOr(Schema.String),
  privateProfile: Schema.Boolean,
  xp: LearningXp,
})

export type RankedUser = typeof RankedUser.Type

export type RankingEntry = RankedUser & { readonly profileVisible: boolean }

export type Ranking = {
  readonly entries: ReadonlyArray<RankingEntry>
  readonly viewer: Option.Option<RankingEntry>
}
