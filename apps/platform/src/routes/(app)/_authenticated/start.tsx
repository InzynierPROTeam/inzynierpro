import { createFileRoute } from '@tanstack/react-router'
import { seo } from '~platform/config/app'
import { StartPage } from '~platform/features/start/StartPage'

export const Route = createFileRoute('/(app)/_authenticated/start')({
  component: StartPage,
  head: () => ({
    meta: [...seo({ title: 'Start' }), { name: 'robots', content: 'noindex' }],
  }),
})
