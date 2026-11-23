import type {
  Ranking as RankingDto,
  RankingEntry as RankingEntryDto,
} from '@inzpro/api-contracts/modules/rankings/responses'
import { Option } from 'effect'

import type { Ranking, RankingEntry } from '../domain/ranking.model.js'

const toRankingEntryDto = (entry: RankingEntry): RankingEntryDto => ({
  position: entry.position,
  userId: entry.userId,
  name: entry.name,
  image: Option.getOrNull(entry.image),
  xp: entry.xp,
  profileVisible: entry.profileVisible,
})

export const toRankingDto = (ranking: Ranking): RankingDto => ({
  entries: ranking.entries.map(toRankingEntryDto),
  viewer: Option.getOrNull(Option.map(ranking.viewer, toRankingEntryDto)),
})
