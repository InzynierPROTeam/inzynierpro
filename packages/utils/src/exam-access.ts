import {
  bothExamAccess,
  oralExamAccess,
  writtenExamAccess,
  type ExamAccessScope,
  type ExamPart,
} from '@inzpro/domain/modules/preparation/exam-access'

export const getExamAccessLabel = (scope: ExamAccessScope) => {
  switch (scope) {
    case writtenExamAccess:
      return 'Egzamin pisemny'
    case oralExamAccess:
      return 'Egzamin ustny'
    case bothExamAccess:
      return 'Egzamin pisemny i ustny'
  }
}

export const hasExamAccess = (accessScope: ExamAccessScope, part: ExamPart) =>
  accessScope === bothExamAccess || accessScope === part
