import {
  allowsSeveralOptions,
  type KnowledgeCheckFormat,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import { Effect, Option, Random } from 'effect'

import { againRating, type ReviewRating } from './review-state.model.js'

export const oralQuizCheckLimit = 5

export const drawKnowledgeChecks = <Check extends { readonly questionId: string }>(
  candidates: ReadonlyArray<Check>,
  limit: number,
) =>
  Effect.map(Random.shuffle(candidates), shuffled => {
    const byQuestion = Map.groupBy(shuffled, candidate => candidate.questionId)
    const groups = [...byQuestion.values()]
    const rounds = Math.max(0, ...groups.map(group => group.length))

    return Array.from({ length: rounds }, (_, round) =>
      groups.flatMap(group => group.slice(round, round + 1)),
    )
      .flat()
      .slice(0, limit)
  })

type CheckOption = { readonly id: string; readonly isCorrect: boolean }

export const isAllowedSelection = (
  format: KnowledgeCheckFormat,
  options: ReadonlyArray<CheckOption>,
  selected: ReadonlyArray<string>,
): boolean => {
  const optionIds = new Set(options.map(option => option.id))
  const distinct = new Set(selected)

  return (
    distinct.size === selected.length &&
    selected.every(id => optionIds.has(id)) &&
    (allowsSeveralOptions(format) ? selected.length >= 1 : selected.length === 1)
  )
}

export const isCorrectSelection = (
  options: ReadonlyArray<CheckOption>,
  selected: ReadonlyArray<string>,
): boolean => {
  const chosen = new Set(selected)

  return options.every(option => option.isCorrect === chosen.has(option.id))
}

export const knowledgeCheckReviewRating = (answer: {
  readonly isCorrect: boolean
  readonly answersCurrentContent: boolean
}): Option.Option<ReviewRating> =>
  answer.answersCurrentContent && !answer.isCorrect ? Option.some(againRating) : Option.none()
