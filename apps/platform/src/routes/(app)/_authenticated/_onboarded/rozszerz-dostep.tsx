import { hasExamAccess } from '@inzpro/utils/exam-access'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Schema } from 'effect'
import { seo } from '~platform/config/app'
import { AccessExtensionPage } from '~platform/features/examPaths/AccessExtensionPage'
import { getAccessReturnPath } from '~platform/features/examPaths/utils'
import { AccessExtensionSearch } from '~platform/features/examPaths/validation'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded/rozszerz-dostep')({
  validateSearch: Schema.toStandardSchemaV1(AccessExtensionSearch),
  beforeLoad: ({ context: { selectedPath }, search }) => {
    if (hasExamAccess(selectedPath.accessScope, search.egzamin)) {
      throw redirect({ to: getAccessReturnPath(search.redirect, search.egzamin), replace: true })
    }
  },
  component: AccessExtensionPage,
  head: () => ({
    meta: seo({ title: 'Rozszerz dostęp' }),
  }),
})
