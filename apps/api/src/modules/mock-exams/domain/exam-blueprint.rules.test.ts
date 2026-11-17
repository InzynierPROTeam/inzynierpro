import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  ExamDurationMinutes,
  ExamSectionName,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import { Option } from 'effect'
import { describe, expect, it } from 'vitest'
import type { ExamBlueprintDraft } from '~api/modules/mock-exams/domain/exam-blueprint.model.js'
import {
  blueprintQuestionCount,
  examBlueprintViolation,
  examUnavailableReason,
} from '~api/modules/mock-exams/domain/exam-blueprint.rules.js'

const buildingLaw = ReferenceDocumentId.make('20000000-0000-4000-8000-000000000001')
const technicalConditions = ReferenceDocumentId.make('20000000-0000-4000-8000-000000000002')

const section = (questionCount: number, documentIds = [buildingLaw]) => ({
  name: ExamSectionName.make('Prawo budowlane'),
  questionCount: QuestionCount.make(questionCount),
  documentIds,
})

const draft = (
  passThreshold: number,
  sections: ExamBlueprintDraft['sections'] = [section(5), section(5, [technicalConditions])],
): ExamBlueprintDraft => ({
  durationMinutes: ExamDurationMinutes.make(10),
  passThreshold: QuestionCount.make(passThreshold),
  sections,
})

const bothDocuments = [buildingLaw, technicalConditions]

describe('exam blueprint validation', () => {
  it('accepts sections from documents on every assigned path with a reachable threshold', () =>
    expect(examBlueprintViolation(draft(6), [bothDocuments, bothDocuments])).toStrictEqual(
      Option.none(),
    ))

  it('counts the questions of every section', () =>
    expect(blueprintQuestionCount(draft(6).sections)).toBe(10))

  it('requires at least one section', () =>
    expect(examBlueprintViolation(draft(1, []), [bothDocuments])).toStrictEqual(
      Option.some('no-sections'),
    ))

  it('requires every section to draw a positive number of questions', () =>
    expect(
      examBlueprintViolation(draft(1, [section(0), section(5)]), [bothDocuments]),
    ).toStrictEqual(Option.some('empty-section')))

  it('requires every section to draw from a document', () =>
    expect(examBlueprintViolation(draft(1, [section(5, [])]), [bothDocuments])).toStrictEqual(
      Option.some('empty-section'),
    ))

  it('accepts thresholds from one to the total question count', () => {
    expect(examBlueprintViolation(draft(1), [bothDocuments])).toStrictEqual(Option.none())
    expect(examBlueprintViolation(draft(10), [bothDocuments])).toStrictEqual(Option.none())
  })

  it('rejects a threshold of zero or above the total question count', () => {
    expect(examBlueprintViolation(draft(0), [bothDocuments])).toStrictEqual(
      Option.some('threshold-out-of-range'),
    )
    expect(examBlueprintViolation(draft(11), [bothDocuments])).toStrictEqual(
      Option.some('threshold-out-of-range'),
    )
  })

  it('rejects a document shared by two sections', () =>
    expect(
      examBlueprintViolation(draft(2, [section(1), section(1, bothDocuments)]), [bothDocuments]),
    ).toStrictEqual(Option.some('shared-document')))

  it('rejects a document missing from any assigned path', () =>
    expect(examBlueprintViolation(draft(6), [bothDocuments, [buildingLaw]])).toStrictEqual(
      Option.some('document-outside-path'),
    ))
})

describe('mock exam availability', () => {
  const sectionWith = (questionCount: number, availableQuestionCount: number) => ({
    questionCount: QuestionCount.make(questionCount),
    availableQuestionCount: QuestionCount.make(availableQuestionCount),
  })

  it('is unavailable without a blueprint', () =>
    expect(examUnavailableReason(Option.none())).toStrictEqual(Option.some('no-blueprint')))

  it('is unavailable when any section has fewer eligible questions than it draws', () =>
    expect(
      examUnavailableReason(Option.some({ sections: [sectionWith(5, 8), sectionWith(5, 4)] })),
    ).toStrictEqual(Option.some('too-few-questions')))

  it('is available when every section has enough eligible questions', () =>
    expect(
      examUnavailableReason(Option.some({ sections: [sectionWith(5, 5), sectionWith(5, 8)] })),
    ).toStrictEqual(Option.none()))
})
