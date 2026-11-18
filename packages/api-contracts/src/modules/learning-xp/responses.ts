import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { Schema } from 'effect'

export const LearningXpResponse = Schema.Struct({ total: LearningXp })

export type LearningXpResponse = typeof LearningXpResponse.Type
