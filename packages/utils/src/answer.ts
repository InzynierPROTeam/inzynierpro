import { Array as Arr } from 'effect'

const answerLetters = ['A', 'B', 'C'] as const

export type AnswerIndex = 0 | 1 | 2

export type AnswerLetter = (typeof answerLetters)[AnswerIndex]

export const getAnswerLetter = (index: AnswerIndex): AnswerLetter => answerLetters[index]

export const withAnswerLetters = <A>(answers: ReadonlyArray<A>) => Arr.zip(answers, answerLetters)
