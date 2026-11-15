import { LearningRoundNumber, type LearningRoundProgress } from './learning-round.model.js'

/** Every question of the path is covered in the round; a path without questions never completes one. */
const isRoundComplete = (progress: LearningRoundProgress) =>
  progress.questionCount > 0 && progress.coveredQuestionCount >= progress.questionCount

/**
 * The round regular study is in: the stored one, or the next once every question is covered in it.
 * The answer covering the last question stores the next round; a withdrawal can also complete the
 * stored round, and then the next answer stores it.
 */
export const currentLearningRound = (progress: LearningRoundProgress): LearningRoundNumber =>
  isRoundComplete(progress) ? LearningRoundNumber.make(progress.round + 1) : progress.round

/** The current round follows a completed one and nothing is covered in it yet. */
export const isNewLearningRound = (progress: LearningRoundProgress) =>
  isRoundComplete(progress) || (progress.round > 1 && progress.coveredQuestionCount === 0)
