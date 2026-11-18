import { Schema } from 'effect'

export const LearningXp = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).pipe(
  Schema.brand('LearningXp'),
)

export type LearningXp = typeof LearningXp.Type
