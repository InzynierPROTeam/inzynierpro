import { Array as Arr } from 'effect'

// A written exam question always has three answers, labelled in their display order.
const answerLetters = ['A', 'B', 'C'] as const

export type AnswerIndex = 0 | 1 | 2

export type AnswerLetter = (typeof answerLetters)[AnswerIndex]

export const getAnswerLetter = (index: AnswerIndex): AnswerLetter => answerLetters[index]

/** Pairs each answer with its letter, keeping the given order. */
export const withAnswerLetters = <A>(answers: ReadonlyArray<A>) => Arr.zip(answers, answerLetters)
