import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  QuestionNoteResult,
  SessionQuestion,
  StudySession,
  SubmitSessionAnswerResponse,
} from '@inzpro/api-contracts/modules/study/responses'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { cosmeticChange } from '~api/modules/learning-content/domain/learning-content.model.js'
import { startTestApi, type TestApi, type TestVisitor } from '~api/test/api-server.js'
import {
  addFixtureQuestion,
  attachFixtureQuestion,
  createStudyFixture,
  publishFixtureRevision,
  studySessionSpecialization,
  withdrawFixtureRevision,
} from '~api/test/learning-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const decode =
  <T, E>(schema: Schema.Codec<T, E>) =>
  async (response: Response) =>
    Schema.decodeUnknownSync(schema)(await response.json())

// A seeded path only the favourites and notes tests add documents to.
const otherPathSpecialization = '60000000-0000-4000-8000-000000000006'

const noteUrl = (pathId: QualificationPathId, questionId: string) =>
  new URL(`/api/v1/study/paths/${pathId}/notes/${questionId}`, api.baseUrl)

// Notes are written with PUT and DELETE, which the shared POST/GET helper does not send.
const putNote = (
  visitor: TestVisitor,
  pathId: QualificationPathId,
  questionId: string,
  text: string,
) =>
  visitor.jar.fetch(noteUrl(pathId, questionId), {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  })

const deleteNote = (visitor: TestVisitor, pathId: QualificationPathId, questionId: string) =>
  visitor.jar.fetch(noteUrl(pathId, questionId), { method: 'DELETE' })

// A learner in a regular-study session over a fresh document with the given number of questions.
const learnerInSession = async (questionCount: number) => {
  const visitor = await loginForPreparation(api)
  const fixture = await createStudyFixture(studySessionSpecialization)
  const questions: Array<Awaited<ReturnType<typeof addFixtureQuestion>>> = []

  for (let index = 0; index < questionCount; index++) {
    questions.push(await addFixtureQuestion(fixture.pathId, fixture.documentId))
  }

  await learningRequest(
    api,
    visitor,
    '/onboarding',
    Schema.encodeSync(CompleteOnboardingPayload)(fixture.config),
  )

  const request = <Body>(path: string, body?: Body) =>
    learningRequest(api, visitor, `/paths/${fixture.pathId}${path}`, body)

  const session = await decode(StudySession)(
    await request('/sessions', {
      documentId: fixture.documentId,
      questionCount,
      questionSelection: 'uncovered',
    }),
  )

  const question = async (position: number) =>
    decode(SessionQuestion)(await request(`/sessions/${session.id}/questions/${position}`))

  const save = (questionId: string, text: string) =>
    putNote(visitor, fixture.pathId, questionId, text)

  const clear = (questionId: string) => deleteNote(visitor, fixture.pathId, questionId)

  const open = (position: number, kind: 'note' | 'explanation' = 'note') =>
    request(`/sessions/${session.id}/questions/${position}/assistance`, { kind })

  const answer = async (position: number) => {
    const shown = await question(position)

    return decode(SubmitSessionAnswerResponse)(
      await request(`/sessions/${session.id}/questions/${position}/answer`, {
        questionRevisionId: shown.questionRevisionId,
        answerId: shown.answers.find(option => option.isCorrect)!.id,
      }),
    )
  }

  const end = () => request(`/sessions/${session.id}/end`, {})

  return { visitor, fixture, questions, session, question, save, clear, open, answer, end }
}

describe('personal notes', () => {
  test('a note is saved, edited and cleared, and shows on the question', async () => {
    const learner = await learnerInSession(1)
    const questionId = (await learner.question(1)).questionId

    expect((await learner.question(1)).note).toBeNull()

    const saved = await learner.save(questionId, 'Remember the 3 m limit.')

    expect(saved.status).toBe(200)
    expect(await decode(QuestionNoteResult)(saved)).toMatchObject({
      questionId,
      note: { text: 'Remember the 3 m limit.', refersToEarlierWording: false },
    })

    await learner.save(questionId, 'Remember the 4 m limit.')

    expect((await learner.question(1)).note).toMatchObject({
      text: 'Remember the 4 m limit.',
      refersToEarlierWording: false,
    })

    for (let attempt = 0; attempt < 2; attempt++) {
      expect(await decode(QuestionNoteResult)(await learner.clear(questionId))).toEqual({
        questionId,
        note: null,
      })
    }

    expect((await learner.question(1)).note).toBeNull()
  })

  test('a note is shared with every path the question is on', async () => {
    const learner = await learnerInSession(1)
    const questionId = learner.questions[0]!.id
    const other = await createStudyFixture(otherPathSpecialization)

    await attachFixtureQuestion(other.pathId, learner.fixture.documentId, questionId)
    await learningRequest(
      api,
      learner.visitor,
      '/onboarding',
      Schema.encodeSync(CompleteOnboardingPayload)(other.config),
    )

    expect(
      (await putNote(learner.visitor, other.pathId, questionId, 'Written on another path.')).status,
    ).toBe(200)
    expect((await learner.question(1)).note).toMatchObject({ text: 'Written on another path.' })

    // Clearing on the other path removes the one note.
    expect((await deleteNote(learner.visitor, other.pathId, questionId)).status).toBe(200)
    expect((await learner.question(1)).note).toBeNull()
  })

  test('a note holds up to 2000 characters and some text', async () => {
    const learner = await learnerInSession(1)
    const questionId = learner.questions[0]!.id
    const longest = 'a'.repeat(2000)

    expect((await learner.save(questionId, longest)).status).toBe(200)

    for (const text of ['a'.repeat(2001), '', '  \n\t ']) {
      const refused = await learner.save(questionId, text)

      expect(refused.status).toBe(400)

      const body = await refused.text()

      expect(JSON.parse(body)).toMatchObject({
        type: 'invalid_request',
        message: 'The request contains invalid data.',
      })
      // The refusal never echoes the note.
      expect(body).not.toContain('aaaaaaaaaa')
    }

    expect((await learner.question(1)).note).toMatchObject({ text: longest })
  })

  test('a note is the learner’s own', async () => {
    const owner = await learnerInSession(1)
    const questionId = owner.questions[0]!.id

    await owner.save(questionId, 'Private memory aid.')

    // Another learner on the same path sees no note on the question and cannot change the owner's.
    const other = await loginForPreparation(api)

    await learningRequest(
      api,
      other,
      '/onboarding',
      Schema.encodeSync(CompleteOnboardingPayload)(owner.fixture.config),
    )

    const otherSession = await decode(StudySession)(
      await learningRequest(api, other, `/paths/${owner.fixture.pathId}/sessions`, {
        documentId: owner.fixture.documentId,
        questionCount: 1,
        questionSelection: 'uncovered',
      }),
    )

    const seenByOther = await decode(SessionQuestion)(
      await learningRequest(
        api,
        other,
        `/paths/${owner.fixture.pathId}/sessions/${otherSession.id}/questions/1`,
      ),
    )

    expect(seenByOther.note).toBeNull()
    expect((await deleteNote(other, owner.fixture.pathId, questionId)).status).toBe(200)
    expect((await owner.question(1)).note).toMatchObject({ text: 'Private memory aid.' })

    // An account without the path cannot write notes on it.
    const stranger = await loginForPreparation(api)

    expect((await putNote(stranger, owner.fixture.pathId, questionId, 'Mine.')).status).toBe(403)
  })

  test('a question that is not on the path cannot get a note from it, but an own note can always be cleared', async () => {
    const learner = await learnerInSession(1)
    const elsewhere = await createStudyFixture(otherPathSpecialization)
    const foreign = await addFixtureQuestion(elsewhere.pathId, elsewhere.documentId)

    for (const questionId of [foreign.id, crypto.randomUUID()]) {
      const refused = await learner.save(questionId, 'Not here.')

      expect(refused.status).toBe(404)
      expect(await refused.json()).toMatchObject({ type: 'question_not_found' })
      expect(await decode(QuestionNoteResult)(await learner.clear(questionId))).toEqual({
        questionId,
        note: null,
      })
    }
  })

  test('the note shows it may refer to earlier wording after a substantive revision, not a cosmetic one', async () => {
    const learner = await learnerInSession(1)
    const questionId = learner.questions[0]!.id

    await learner.save(questionId, 'About the first wording.')
    await publishFixtureRevision(questionId, cosmeticChange)

    expect((await learner.question(1)).note).toMatchObject({ refersToEarlierWording: false })

    await publishFixtureRevision(questionId)

    expect((await learner.question(1)).note).toMatchObject({
      text: 'About the first wording.',
      refersToEarlierWording: true,
    })

    // Editing the note stores the current revision, so it refers to the current wording again.
    expect(
      await decode(QuestionNoteResult)(await learner.save(questionId, 'About the new wording.')),
    ).toMatchObject({ note: { refersToEarlierWording: false } })
    expect((await learner.question(1)).note).toMatchObject({ refersToEarlierWording: false })
  })

  test('the browser may save and clear notes from the platform', async () => {
    const owner = await learnerInSession(1)

    for (const method of ['PUT', 'DELETE']) {
      const preflight = await fetch(
        new URL(
          `/api/v1/study/paths/${owner.fixture.pathId}/notes/${owner.questions[0]!.id}`,
          api.baseUrl,
        ),
        {
          method: 'OPTIONS',
          headers: {
            origin: 'http://localhost:8001',
            'access-control-request-method': method,
          },
        },
      )

      expect(preflight.headers.get('access-control-allow-methods')).toContain(method)
    }
  })
})

describe('note assistance', () => {
  test('opening an empty note records nothing and the answer stays independent', async () => {
    const learner = await learnerInSession(1)

    const opened = await learner.open(1)

    expect(opened.status).toBe(200)
    expect(await decode(SessionQuestion)(opened)).toMatchObject({ noteOpenedAt: null })
    expect((await learner.answer(1)).question.answer).toMatchObject({
      isCorrect: true,
      isAssisted: false,
    })
  })

  test('opening a saved note before answering is recorded once and assists the answer', async () => {
    const learner = await learnerInSession(1)

    await learner.save(learner.questions[0]!.id, 'Memory aid.')

    const opened = await decode(SessionQuestion)(await learner.open(1))

    expect(opened.noteOpenedAt).not.toBeNull()
    expect(opened.explanationOpenedAt).toBeNull()
    // Opening it again keeps the first recorded opening.
    expect(await decode(SessionQuestion)(await learner.open(1))).toEqual(opened)

    // Clearing the note afterwards keeps the record: the learner saw it before answering.
    await learner.clear(learner.questions[0]!.id)

    expect((await learner.answer(1)).question.answer).toMatchObject({
      isCorrect: true,
      isAssisted: true,
    })
  })

  test('opening the note after answering or in an ended session changes nothing', async () => {
    const learner = await learnerInSession(2)

    for (const question of learner.questions) {
      await learner.save(question.id, 'Memory aid.')
    }

    const answered = await learner.answer(1)
    const afterAnswer = await decode(SessionQuestion)(await learner.open(1))

    expect(afterAnswer.noteOpenedAt).toBeNull()
    expect(afterAnswer.answer).toEqual(answered.question.answer)

    await learner.end()

    expect(await decode(SessionQuestion)(await learner.open(2))).toMatchObject({
      noteOpenedAt: null,
      answer: null,
    })
  })

  test('opening the note on a withdrawn question changes nothing', async () => {
    const learner = await learnerInSession(1)

    await learner.save(learner.questions[0]!.id, 'Memory aid.')
    await withdrawFixtureRevision(learner.questions[0]!.revisionId)

    expect(await decode(SessionQuestion)(await learner.open(1))).toMatchObject({
      isWithdrawn: true,
      noteOpenedAt: null,
    })
  })

  test('opening both the note and the explanation records both', async () => {
    const learner = await learnerInSession(1)

    await learner.save(learner.questions[0]!.id, 'Memory aid.')
    await learner.open(1, 'note')

    const opened = await decode(SessionQuestion)(await learner.open(1, 'explanation'))

    expect(opened.noteOpenedAt).not.toBeNull()
    expect(opened.explanationOpenedAt).not.toBeNull()
    expect((await learner.answer(1)).question.answer).toMatchObject({ isAssisted: true })
  })

  test('an unknown kind of opening is refused', async () => {
    const learner = await learnerInSession(1)

    const refused = await learningRequest(
      api,
      learner.visitor,
      `/paths/${learner.fixture.pathId}/sessions/${learner.session.id}/questions/1/assistance`,
      { kind: 'answer-key' },
    )

    expect(refused.status).toBe(400)
  })
})
