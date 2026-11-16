import { LearningRoundNumber, type LearningRoundProgress } from './learning-round.model.js'

const isRoundComplete = (progress: LearningRoundProgress) =>
  progress.questionCount > 0 && progress.coveredQuestionCount >= progress.questionCount

// A withdrawal can complete the stored round before an answer persists the next one.
export const currentLearningRound = (progress: LearningRoundProgress): LearningRoundNumber =>
  isRoundComplete(progress) ? LearningRoundNumber.make(progress.round + 1) : progress.round

export const isNewLearningRound = (progress: LearningRoundProgress) =>
  isRoundComplete(progress) || (progress.round > 1 && progress.coveredQuestionCount === 0)
