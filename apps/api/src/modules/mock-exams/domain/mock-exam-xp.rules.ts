import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { DailyXpAwardLimit } from '~api/modules/learning-xp/domain/learning-xp.model.js'

const examAwards = { answerBase: 1, correctAnswer: 1, finished: 10, passed: 10 } as const
export const finishedExamDailyLimit = DailyXpAwardLimit.make(3)

export const finalExamAnswerXp = (isCorrect: boolean) =>
  LearningXp.make(examAwards.answerBase + (isCorrect ? examAwards.correctAnswer : 0))

export const finishedExamXp = (passed: boolean) =>
  LearningXp.make(examAwards.finished + (passed ? examAwards.passed : 0))
