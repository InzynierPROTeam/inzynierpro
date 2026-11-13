import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { hasExamAccess } from '@inzpro/utils/exam-access'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/_oralValid')({
  beforeLoad: ({ context: { selectedPath }, location }) => {
    if (!hasExamAccess(selectedPath.accessScope, oralExamAccess)) {
      throw redirect({
        to: '/rozszerz-dostep',
        search: { egzamin: oralExamAccess, redirect: location.href },
        replace: true,
      })
    }
  },
})
