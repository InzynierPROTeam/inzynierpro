import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'

const oralAwards = { selfAssessment: 2, quizBase: 1, quizCorrect: 1 } as const

export const oralSelfAssessmentXp = LearningXp.make(oralAwards.selfAssessment)

export const quizCheckXp = (isCorrect: boolean) =>
  LearningXp.make(oralAwards.quizBase + (isCorrect ? oralAwards.quizCorrect : 0))
