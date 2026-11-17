import {
  AnswerOralQuizCheckResponse,
  type OralQuizCheck,
  OralQuizChecksResponse,
  OralSessionQuestion,
  OralSessionQuiz,
  OralSessionQuizState,
  OralStudySession,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import type { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { Option, Schema } from 'effect'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import {
  addFixtureKnowledgeCheck,
  addFixtureOralCategory,
  addFixtureOralQuestion,
  currentOralReviewState,
  publishFixtureOralRevision,
} from '~api/test/oral-learning-fixtures.js'
import { createStudyFixture, studySessionSpecialization } from '~api/test/preparation-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const allFormats = ['single_choice', 'true_false', 'multiple_choice'] as const

const singleChoice = [
  { text: 'Right', isCorrect: true },
  { text: 'Wrong one', isCorrect: false },
  { text: 'Wrong two', isCorrect: false },
]

const trueFalse = [
  { text: 'Prawda', isCorrect: true },
  { text: 'Fałsz', isCorrect: false },
]

const multipleChoice = [
  { text: 'Right one', isCorrect: true },
  { text: 'Right two', isCorrect: true },
  { text: 'Wrong', isCorrect: false },
  { text: 'Also wrong', isCorrect: false },
]

const learnerWithQuestions = async (questionCount: number) => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  const categoryId = await addFixtureOralCategory()

  const questions: Array<Awaited<ReturnType<typeof addFixtureOralQuestion>>> = []

  for (let position = 1; position <= questionCount; position++) {
    questions.push(await addFixtureOralQuestion(fixture.pathId, categoryId, position))
  }

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const question = (index: number) => {
    const found = questions[index]

    if (found === undefined) {
      throw new Error(`Missing fixture question ${index}`)
    }

    return found
  }

  const base = `/paths/${fixture.pathId}/oral`

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `${base}${path}`, body)

  const startSession = async () =>
    Schema.decodeUnknownSync(OralStudySession)(
      await (await request('/sessions', { categoryId, questionCount })).json(),
    )

  const assessAll = async (session: OralStudySession) => {
    for (let position = 1; position <= questionCount; position++) {
      const shown = Schema.decodeUnknownSync(OralSessionQuestion)(
        await (await request(`/sessions/${session.id}/questions/${position}`)).json(),
      )

      await request(`/sessions/${session.id}/questions/${position}/self-assessment`, {
        oralRevisionId: shown.oralRevisionId,
        selfAssessment: 'easy',
      })
    }
  }

  const finishedSession = async () => {
    const session = await startSession()
    await assessAll(session)
    await request(`/sessions/${session.id}/end`, {})

    return session
  }

  const quizState = async (sessionId: string) =>
    Schema.decodeUnknownSync(OralSessionQuizState)(
      await (await request(`/sessions/${sessionId}/quiz`)).json(),
    )

  const startQuiz = (sessionId: string, formats: ReadonlyArray<string> = allFormats) =>
    request(`/sessions/${sessionId}/quiz`, { formats })

  const readChecks = async (sessionId: string, query = '') =>
    Schema.decodeUnknownSync(Schema.toCodecJson(OralQuizChecksResponse))(
      await (await request(`/sessions/${sessionId}/quiz/checks${query}`)).json(),
    )

  const readCheck = async (sessionId: string, position: number) => {
    const check = (await readChecks(sessionId)).data.find(
      candidate => candidate.position === position,
    )

    if (check === undefined) {
      throw new Error(`Missing quiz check ${position}`)
    }

    return check
  }

  const answer = (sessionId: string, position: number, optionIds: ReadonlyArray<string>) =>
    request(`/sessions/${sessionId}/quiz/checks/${position}/answer`, { optionIds })

  const answered = async (response: Response) =>
    Schema.decodeUnknownSync(AnswerOralQuizCheckResponse)(await response.json())

  return {
    visitor,
    fixture,
    questions,
    question,
    request,
    startSession,
    assessAll,
    finishedSession,
    quizState,
    startQuiz,
    readCheck,
    answer,
    answered,
    readChecks,
  }
}

const optionIdsByText = (check: OralQuizCheck, texts: ReadonlyArray<string>) =>
  check.options.filter(option => texts.includes(option.text)).map(option => option.id)

describe('quiz offer', () => {
  test('is offered only after the session ends and only for compatible checks', async () => {
    const learner = await learnerWithQuestions(2)
    const replaced = learner.question(0)
    const kept = learner.question(1)

    await addFixtureKnowledgeCheck(replaced.id, replaced.revisionId, 'single_choice', singleChoice)
    await publishFixtureOralRevision(replaced.id)
    await addFixtureKnowledgeCheck(kept.id, kept.revisionId, 'true_false', trueFalse)
    await addFixtureKnowledgeCheck(
      kept.id,
      kept.revisionId,
      'multiple_choice',
      multipleChoice,
      false,
    )

    const session = await learner.startSession()

    expect(await learner.quizState(session.id)).toEqual({ quiz: null, availableFormats: [] })
    expect((await learner.startQuiz(session.id)).status).toBe(409)

    await learner.assessAll(session)
    await learner.request(`/sessions/${session.id}/end`, {})

    expect(await learner.quizState(session.id)).toEqual({
      quiz: null,
      availableFormats: ['true_false'],
    })
    expect((await learner.startQuiz(session.id, ['single_choice'])).status).toBe(409)
  })

  test('keeps a cosmetic oral revision compatible with its checks', async () => {
    const learner = await learnerWithQuestions(1)
    const question = learner.question(0)

    await addFixtureKnowledgeCheck(question.id, question.revisionId, 'single_choice', singleChoice)
    await publishFixtureOralRevision(question.id, 'cosmetic')

    const session = await learner.finishedSession()

    expect(await learner.quizState(session.id)).toMatchObject({
      availableFormats: ['single_choice'],
    })
  })

  test('is not offered for another learner’s session', async () => {
    const learner = await learnerWithQuestions(1)
    const question = learner.question(0)
    await addFixtureKnowledgeCheck(question.id, question.revisionId, 'true_false', trueFalse)
    const session = await learner.finishedSession()
    const stranger = await loginForPreparation(api)

    await learningRequest(
      api,
      stranger,
      '/onboarding',
      Schema.encodeSync(CompleteOnboardingPayload)(learner.fixture.config),
    )

    const path = `/paths/${learner.fixture.pathId}/oral/sessions/${session.id}/quiz`

    expect(await (await learningRequest(api, stranger, path)).json()).toBeNull()
    expect((await learningRequest(api, stranger, path, { formats: allFormats })).status).toBe(404)
  })
})

describe('quiz start', () => {
  test('draws up to five checks over different session questions and keeps one quiz per session', async () => {
    const learner = await learnerWithQuestions(6)

    for (const question of learner.questions) {
      await addFixtureKnowledgeCheck(
        question.id,
        question.revisionId,
        'single_choice',
        singleChoice,
      )
      await addFixtureKnowledgeCheck(question.id, question.revisionId, 'true_false', trueFalse)
    }

    const session = await learner.finishedSession()
    const response = await learner.startQuiz(session.id)
    expect(response.status).toBe(200)
    const quiz = Schema.decodeUnknownSync(OralSessionQuiz)(await response.json())

    expect(quiz).toMatchObject({
      sessionId: session.id,
      checkCount: 5,
      answeredCount: 0,
      isCompleted: false,
    })

    const checks = await learner.readChecks(session.id)
    expect(checks.data).toHaveLength(5)
    expect(checks.data.every(check => check.result === null)).toBe(true)

    const again = Schema.decodeUnknownSync(OralSessionQuiz)(
      await (await learner.startQuiz(session.id)).json(),
    )

    expect(again).toEqual(quiz)
    expect(await learner.quizState(session.id)).toEqual({ quiz, availableFormats: [] })
  })

  test('covers each session question once before repeating one', async () => {
    const learner = await learnerWithQuestions(3)
    const checkQuestion = new Map<string, OralQuestionId>()

    for (const question of learner.questions) {
      for (const format of ['single_choice', 'multiple_choice'] as const) {
        const check = await addFixtureKnowledgeCheck(
          question.id,
          question.revisionId,
          format,
          format === 'single_choice' ? singleChoice : multipleChoice,
        )

        for (const option of check.options) {
          checkQuestion.set(option.id, question.id)
        }
      }
    }

    const session = await learner.finishedSession()

    await learner.startQuiz(session.id)
    const { data: checks } = await learner.readChecks(session.id)

    const covered = checks.map(check =>
      check.options.map(option => checkQuestion.get(option.id)).at(0),
    )

    expect(covered).toHaveLength(5)
    expect(new Set(covered.slice(0, 3))).toEqual(new Set(learner.questions.map(q => q.id)))
  })

  test('stores the option order of each check', async () => {
    const learner = await learnerWithQuestions(1)
    const question = learner.question(0)
    await addFixtureKnowledgeCheck(
      question.id,
      question.revisionId,
      'multiple_choice',
      multipleChoice,
    )
    const session = await learner.finishedSession()
    await learner.startQuiz(session.id)

    const first = await learner.readCheck(session.id, 1)

    expect(first.options.map(option => option.text).toSorted()).toEqual(
      multipleChoice.map(option => option.text).toSorted(),
    )
    expect(await learner.readCheck(session.id, 1)).toEqual(first)
  })
})

describe('quiz answers', () => {
  const learnerWithMultipleChoiceQuiz = async () => {
    const learner = await learnerWithQuestions(1)
    const question = learner.question(0)
    await addFixtureKnowledgeCheck(
      question.id,
      question.revisionId,
      'multiple_choice',
      multipleChoice,
    )
    const session = await learner.finishedSession()
    await learner.startQuiz(session.id)

    return { ...learner, question, session, check: await learner.readCheck(session.id, 1) }
  }

  test('scores multiple choice binary and shows missed and wrong options with the explanation', async () => {
    const { session, check, answer } = await learnerWithMultipleChoiceQuiz()
    const selected = optionIdsByText(check, ['Right one', 'Wrong'])

    const response = await answer(session.id, 1, selected)
    expect(response.status).toBe(200)

    const { check: answered, quiz } = Schema.decodeUnknownSync(AnswerOralQuizCheckResponse)(
      await response.json(),
    )

    expect(answered.result).toMatchObject({
      isCorrect: false,
      explanation: { content: expect.any(Object) },
    })
    expect(answered.result?.correctOptionIds.toSorted()).toEqual(
      optionIdsByText(check, ['Right one', 'Right two']).toSorted(),
    )
    expect(answered.result?.selectedOptionIds.toSorted()).toEqual(selected.toSorted())
    expect(quiz).toMatchObject({ answeredCount: 1, isCompleted: true })
    expect(quiz).not.toHaveProperty('score')
  })

  test('accepts the complete set of correct options as correct', async () => {
    const learner = await learnerWithMultipleChoiceQuiz()

    const { check } = await learner.answered(
      await learner.answer(
        learner.session.id,
        1,
        optionIdsByText(learner.check, ['Right one', 'Right two']),
      ),
    )

    expect(check.result?.isCorrect).toBe(true)
  })

  test('keeps answers final while retries are safe', async () => {
    const { session, check, answer, readCheck } = await learnerWithMultipleChoiceQuiz()
    const selected = optionIdsByText(check, ['Right two'])

    const first = await (await answer(session.id, 1, selected)).json()
    const retry = await answer(session.id, 1, selected)
    expect(retry.status).toBe(200)
    expect(await retry.json()).toEqual(first)

    expect((await answer(session.id, 1, optionIdsByText(check, ['Right one']))).status).toBe(409)
    expect((await readCheck(session.id, 1)).result?.selectedOptionIds).toEqual(selected)
  })

  test('rejects selections that do not fit the check', async () => {
    const learner = await learnerWithQuestions(1)
    const question = learner.question(0)
    await addFixtureKnowledgeCheck(question.id, question.revisionId, 'single_choice', singleChoice)
    const session = await learner.finishedSession()
    await learner.startQuiz(session.id)
    const check = await learner.readCheck(session.id, 1)

    expect((await learner.answer(session.id, 1, [])).status).toBe(422)
    expect((await learner.answer(session.id, 1, [crypto.randomUUID()])).status).toBe(422)
    expect(
      (
        await learner.answer(
          session.id,
          1,
          check.options.slice(0, 2).map(option => option.id),
        )
      ).status,
    ).toBe(422)
    expect(
      (
        await learner.answer(
          session.id,
          2,
          check.options.slice(0, 1).map(option => option.id),
        )
      ).status,
    ).toBe(404)
  })

  test('lets the learner skip a check and completes without a score once every check is answered', async () => {
    const learner = await learnerWithQuestions(2)

    for (const question of learner.questions) {
      await addFixtureKnowledgeCheck(question.id, question.revisionId, 'true_false', trueFalse)
    }

    const session = await learner.finishedSession()
    await learner.startQuiz(session.id)

    const second = await learner.readCheck(session.id, 2)
    await learner.answer(session.id, 2, optionIdsByText(second, ['Fałsz']))

    const skipped = await learner.quizState(session.id)
    expect(skipped.quiz).toMatchObject({ answeredCount: 1, isCompleted: false })
    expect(
      (await learner.readChecks(session.id)).data.map(check => check.result?.isCorrect ?? null),
    ).toEqual([null, false])

    const first = await learner.readCheck(session.id, 1)
    await learner.answer(session.id, 1, optionIdsByText(first, ['Prawda']))

    const { quiz } = await learner.quizState(session.id)

    expect(quiz).toMatchObject({ answeredCount: 2, isCompleted: true })
    expect(
      (await learner.readChecks(session.id)).data.map(check => check.result?.isCorrect),
    ).toEqual([true, false])
  })

  test('pages through the checks in their quiz order', async () => {
    const learner = await learnerWithQuestions(3)

    for (const question of learner.questions) {
      await addFixtureKnowledgeCheck(question.id, question.revisionId, 'true_false', trueFalse)
    }

    const session = await learner.finishedSession()
    await learner.startQuiz(session.id)

    const first = await learner.readChecks(session.id, '?limit=2')
    expect(first.data.map(check => check.position)).toEqual([1, 2])
    expect(first.meta).toMatchObject({ hasMore: true, nextCursor: expect.any(String) })

    const second = await learner.readChecks(
      session.id,
      `?limit=2&cursor=${first.meta.nextCursor ?? ''}`,
    )

    expect(second.data.map(check => check.position)).toEqual([3])
    expect(second.meta.hasMore).toBe(false)
    expect((await learner.request(`/sessions/${session.id}/quiz/checks?cursor=nope`)).status).toBe(
      400,
    )
  })

  test('refuses to resume with an unsupported format and keeps the fixed set', async () => {
    const learner = await learnerWithQuestions(1)
    const question = learner.question(0)
    await addFixtureKnowledgeCheck(
      question.id,
      question.revisionId,
      'multiple_choice',
      multipleChoice,
    )
    const session = await learner.finishedSession()

    const quiz = await (await learner.startQuiz(session.id)).json()
    const resumed = await learner.startQuiz(session.id, ['single_choice', 'true_false'])

    expect(resumed.status).toBe(422)
    expect(await resumed.json()).toMatchObject({ type: 'oral_quiz_format_unsupported' })
    expect((await learner.quizState(session.id)).quiz).toEqual(quiz)
  })
})

describe('quiz evidence', () => {
  const learnerWithTrueFalseQuiz = async () => {
    const learner = await learnerWithQuestions(1)
    const question = learner.question(0)
    await addFixtureKnowledgeCheck(question.id, question.revisionId, 'true_false', trueFalse)
    const session = await learner.finishedSession()
    await learner.startQuiz(session.id)

    const state = () =>
      currentOralReviewState(learner.visitor.userId, learner.fixture.pathId, question.id)

    return { ...learner, session, state, check: await learner.readCheck(session.id, 1) }
  }

  test('a wrong answer applies Again to the linked oral question without changing the self-assessment', async () => {
    const learner = await learnerWithTrueFalseQuiz()
    const before = Option.getOrThrow(await learner.state())

    await learner.answer(learner.session.id, 1, optionIdsByText(learner.check, ['Fałsz']))

    const after = Option.getOrThrow(await learner.state())
    expect(after.reps).toBe(before.reps + 1)
    expect(after.lapses).toBe(before.lapses + 1)
    expect(after.dueAt.epochMilliseconds).toBeLessThan(before.dueAt.epochMilliseconds)

    const shown = Schema.decodeUnknownSync(OralSessionQuestion)(
      await (await learner.request(`/sessions/${learner.session.id}/questions/1`)).json(),
    )

    expect(shown.selfAssessment?.value).toBe('easy')
  })

  test('a correct answer leaves the oral review state unchanged', async () => {
    const learner = await learnerWithTrueFalseQuiz()
    const before = await learner.state()

    await learner.answer(learner.session.id, 1, optionIdsByText(learner.check, ['Prawda']))

    expect(await learner.state()).toEqual(before)
  })
})
