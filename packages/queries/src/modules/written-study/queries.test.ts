import { SessionPreview } from '@inzpro/api-contracts/modules/written-study/responses'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import {
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/learning/study-session'
import { withHttpServer } from '@inzpro/testing/http'
import { Schema } from 'effect'
import { HttpRouter, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { preparationKeys } from '~queries/modules/preparation/keys.js'
import { pathsQueryOptions } from '~queries/modules/preparation/queries.js'
import {
  dailyPlanQueryOptions,
  documentQueryOptions,
  documentsInfiniteQueryOptions,
  questionDetailsQueryOptions,
  sessionPreviewQueryOptions,
} from '~queries/modules/written-study/queries.js'
import { withQueryClient } from '~queries/test/query-client.js'

import { writtenStudyKeys } from './keys.js'

const pathA = Schema.decodeSync(SessionPreview.fields.qualificationPathId)(
  '10000000-0000-4000-8000-000000000001',
)

const pathB = Schema.decodeSync(SessionPreview.fields.qualificationPathId)(
  '10000000-0000-4000-8000-000000000002',
)

const documentId = Schema.decodeSync(SessionPreview.fields.document.fields.id)(
  '20000000-0000-4000-8000-000000000001',
)

const userId = Schema.decodeSync(UserId)('a0000000-0000-4000-8000-000000000001')

const document = {
  id: documentId,
  title: 'Test document',
  availableQuestionCount: 2,
  completedQuestionCount: 0,
}

test('a path parent key invalidates its documents and preview while preserving other paths and the path list', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        '/api/v1/preparation/paths',
        HttpServerResponse.jsonUnsafe({ data: [], meta: { hasMore: false } }),
      ),
      ...[pathA, pathB].map(id =>
        HttpRouter.route(
          'GET',
          `/api/v1/study/paths/${id}/documents`,
          HttpServerResponse.jsonUnsafe({ data: [document], meta: { hasMore: false } }),
        ),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${pathA}/documents/${documentId}`,
        HttpServerResponse.jsonUnsafe({ document }),
      ),
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${pathA}/preview`,
        HttpServerResponse.jsonUnsafe({
          qualificationPathId: pathA,
          document,
          mode: 'written-study',
          questionSelection: 'uncovered',
          availableQuestionCount: 2,
          settings: {
            defaultQuestionCount: 2,
            canChangeQuestionCount: false,
            minimumQuestionCount: 2,
            maximumQuestionCount: 2,
          },
        }),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async client => {
        const paths = pathsQueryOptions(httpClient, userId, { query: {} })

        const documentsA = documentsInfiniteQueryOptions(httpClient, userId, {
          query: {},
          params: { qualificationPathId: pathA },
        })

        const documentsB = documentsInfiniteQueryOptions(httpClient, userId, {
          query: {},
          params: { qualificationPathId: pathB },
        })

        const otherUserId = Schema.decodeSync(UserId)('a0000000-0000-4000-8000-000000000002')

        const otherAccount = documentsInfiniteQueryOptions(httpClient, otherUserId, {
          query: {},
          params: { qualificationPathId: pathA },
        })

        const category = documentQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathA, documentId },
        })

        const foreignCategory = documentQueryOptions(httpClient, otherUserId, {
          params: { qualificationPathId: pathA, documentId },
        })

        expect(category.queryKey).not.toEqual(foreignCategory.queryKey)
        expect(category.queryKey).not.toEqual(documentsA.queryKey)

        const preview = sessionPreviewQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathA },
          query: { documentId },
        })

        await Promise.all([
          client.query(paths),
          client.infiniteQuery(otherAccount),
          client.infiniteQuery(documentsA),
          client.infiniteQuery(documentsB),
          client.query(preview),
          client.query(category),
          client.query(foreignCategory),
        ])
        expect(client.getQueryData(category.queryKey)).toEqual({ document })
        await client.invalidateQueries({ queryKey: writtenStudyKeys.path(userId, pathA) })
        expect(client.getQueryState(category.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(foreignCategory.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(documentsA.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(preview.queryKey)?.isInvalidated).toBe(true)
        expect(client.getQueryState(documentsB.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(otherAccount.queryKey)?.isInvalidated).toBe(false)
        expect(client.getQueryState(paths.queryKey)?.isInvalidated).toBe(false)
        await client.invalidateQueries({ queryKey: preparationKeys.paths(userId) })
        expect(client.getQueryState(paths.queryKey)?.isInvalidated).toBe(true)
      }),
  ))

test('a session group invalidates its own summary while the path group covers every session', () => {
  const sessionA = Schema.decodeSync(StudySessionId)('b0000000-0000-4000-8000-000000000001')
  const sessionB = Schema.decodeSync(StudySessionId)('b0000000-0000-4000-8000-000000000002')

  const summaryKey = (sessionId: StudySessionId) =>
    writtenStudyKeys.getSessionSummary(userId, {
      params: { qualificationPathId: pathA, sessionId },
    })

  const startsWith = (key: ReadonlyArray<unknown>, parent: ReadonlyArray<unknown>) =>
    parent.every((part, index) => key[index] === part)

  expect(startsWith(summaryKey(sessionA), writtenStudyKeys.session(userId, pathA, sessionA))).toBe(
    true,
  )
  expect(startsWith(summaryKey(sessionB), writtenStudyKeys.session(userId, pathA, sessionA))).toBe(
    false,
  )
  expect(
    startsWith(
      writtenStudyKeys.getSession(userId, {
        params: { qualificationPathId: pathA, sessionId: sessionB },
      }),
      writtenStudyKeys.path(userId, pathA),
    ),
  ).toBe(true)
  expect(
    startsWith(
      writtenStudyKeys.getLatestSession(userId, {
        params: { qualificationPathId: pathA },
        query: { documentId },
      }),
      writtenStudyKeys.path(userId, pathA),
    ),
  ).toBe(true)
})

test('the progress group an answer refreshes covers the review preview and the unfinished review session of every scope', () => {
  const startsWith = (key: ReadonlyArray<unknown>, parent: ReadonlyArray<unknown>) =>
    parent.every((part, index) => key[index] === part)

  const progress = writtenStudyKeys.progress(userId, pathA)

  for (const query of [{}, { documentId }]) {
    expect(
      startsWith(
        writtenStudyKeys.getReviewPreview(userId, {
          params: { qualificationPathId: pathA },
          query,
        }),
        progress,
      ),
    ).toBe(true)
    expect(
      startsWith(
        writtenStudyKeys.getReviewSession(userId, {
          params: { qualificationPathId: pathA },
          query,
        }),
        progress,
      ),
    ).toBe(true)
  }

  expect(
    startsWith(
      writtenStudyKeys.getReviewPreview(userId, {
        params: { qualificationPathId: pathB },
        query: {},
      }),
      progress,
    ),
  ).toBe(false)
})

test('the next step after a session refreshes with the progress group, not only with its session', () => {
  const key = writtenStudyKeys.getSessionNextStep(userId, {
    params: {
      qualificationPathId: pathA,
      sessionId: Schema.decodeSync(StudySessionId)('b0000000-0000-4000-8000-000000000001'),
    },
  })

  const progress = writtenStudyKeys.progress(userId, pathA)

  expect(progress.every((part, index) => key[index] === part)).toBe(true)
})

test('the favourites group covers the favourites previews on every path, and nothing else', () => {
  const startsWith = (key: ReadonlyArray<unknown>, parent: ReadonlyArray<unknown>) =>
    parent.every((part, index) => key[index] === part)

  const favorites = writtenStudyKeys.favorites(userId)
  const sessionId = Schema.decodeSync(StudySessionId)('b0000000-0000-4000-8000-000000000001')
  const position = Schema.decodeSync(SessionQuestionPosition)(1)

  for (const qualificationPathId of [pathA, pathB]) {
    for (const query of [{}, { documentId }]) {
      expect(
        startsWith(
          writtenStudyKeys.getFavoritesPreview(userId, { params: { qualificationPathId }, query }),
          favorites,
        ),
      ).toBe(true)
    }

    expect(
      startsWith(
        writtenStudyKeys.getSessionQuestion(userId, {
          params: { qualificationPathId, sessionId, position },
        }),
        favorites,
      ),
    ).toBe(false)
  }

  expect(startsWith(favorites, writtenStudyKeys.account(userId))).toBe(true)
})

test('the questions group a mark or a note refreshes covers every session question, on every path, and nothing else', () => {
  const startsWith = (key: ReadonlyArray<unknown>, parent: ReadonlyArray<unknown>) =>
    parent.every((part, index) => key[index] === part)

  const questions = writtenStudyKeys.questions(userId)
  const otherUserId = Schema.decodeSync(UserId)('a0000000-0000-4000-8000-000000000002')
  const sessionId = Schema.decodeSync(StudySessionId)('b0000000-0000-4000-8000-000000000001')
  const position = Schema.decodeSync(SessionQuestionPosition)(1)

  for (const qualificationPathId of [pathA, pathB]) {
    expect(
      startsWith(
        writtenStudyKeys.getSessionQuestion(userId, {
          params: { qualificationPathId, sessionId, position },
        }),
        questions,
      ),
    ).toBe(true)
    expect(
      startsWith(
        writtenStudyKeys.getSession(userId, { params: { qualificationPathId, sessionId } }),
        questions,
      ),
    ).toBe(false)
    expect(
      startsWith(
        writtenStudyKeys.getFavoritesPreview(userId, {
          params: { qualificationPathId },
          query: {},
        }),
        questions,
      ),
    ).toBe(false)
  }

  expect(
    startsWith(
      writtenStudyKeys.getSessionQuestion(otherUserId, {
        params: { qualificationPathId: pathA, sessionId, position },
      }),
      questions,
    ),
  ).toBe(false)
  expect(startsWith(questions, writtenStudyKeys.account(userId))).toBe(true)
})

test('the unfinished favourites session refreshes with the progress group of its path', () => {
  const key = writtenStudyKeys.getFavoritesSession(userId, {
    params: { qualificationPathId: pathA },
    query: {},
  })

  expect(writtenStudyKeys.progress(userId, pathA).every((part, index) => key[index] === part)).toBe(
    true,
  )
})

test('the written daily plan refreshes with the progress group an answer invalidates', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${pathA}/daily-plan`,
        HttpServerResponse.jsonUnsafe({
          status: 'planned',
          examDate: '2027-05-20T22:00:00.000Z',
          targetDate: '2027-05-13T22:00:00.000Z',
          daysUntilExam: 189,
          targetQuestionCount: 3,
          completedQuestionCount: 4,
          questionsBehindPace: 0,
          settings: { version: 1, preference: { mode: 'default' } },
        }),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async client => {
        const plan = dailyPlanQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathA },
        })

        expect(await client.query(plan)).toMatchObject({
          status: 'planned',
          completedQuestionCount: 4,
        })
        await client.invalidateQueries({
          queryKey: writtenStudyKeys.progress(userId, pathA),
          refetchType: 'none',
        })
        expect(client.getQueryState(plan.queryKey)?.isInvalidated).toBe(true)
      }),
  ))

test('a question details reads through the questions group, so a mark or a note on any path refreshes it', () => {
  const questionId = WrittenQuestionId.make('c0000000-0000-4000-8000-000000000001')

  const details = {
    questionId,
    questionRevisionId: 'c1000000-0000-4000-8000-000000000001',
    body: 'Pytanie',
    answers: [{ id: 'c2000000-0000-4000-8000-000000000001', text: 'Odpowiedź', isCorrect: true }],
    explanation: {
      content: { version: 1, doc: { type: 'doc', content: [{ type: 'paragraph' }] } },
      assets: [],
    },
    references: [],
    isFavorite: true,
    note: null,
  }

  return withHttpServer(
    [
      HttpRouter.route(
        'GET',
        `/api/v1/study/paths/${pathA}/questions/${questionId}`,
        HttpServerResponse.jsonUnsafe(details),
      ),
    ],
    ({ httpClient }) =>
      withQueryClient(async client => {
        const read = questionDetailsQueryOptions(httpClient, userId, {
          params: { qualificationPathId: pathA, questionId },
        })

        expect(await client.query(read)).toMatchObject({ questionId, isFavorite: true })

        await client.invalidateQueries({
          queryKey: writtenStudyKeys.favorites(userId),
          refetchType: 'none',
        })
        expect(client.getQueryState(read.queryKey)?.isInvalidated).toBe(false)

        await client.invalidateQueries({
          queryKey: writtenStudyKeys.questions(userId),
          refetchType: 'none',
        })
        expect(client.getQueryState(read.queryKey)?.isInvalidated).toBe(true)
      }),
  )
})
