import { writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { hasExamAccess } from '@inzpro/utils/exam-access'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/_writtenValid')({
  beforeLoad: ({ context: { selectedPath }, location }) => {
    if (!hasExamAccess(selectedPath.accessScope, writtenExamAccess)) {
      throw redirect({
        to: '/rozszerz-dostep',
        search: { egzamin: writtenExamAccess, redirect: location.href },
        replace: true,
      })
    }
  },
})
