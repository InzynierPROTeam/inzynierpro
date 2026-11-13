import { createFileRoute } from '@tanstack/react-router'
import { appName, seo } from '~platform/config/app'
import { faqPageSchema, softwareApplicationSchema } from '~platform/config/seo-schemas'
import { HomePage } from '~platform/features/home/HomePage'

export const Route = createFileRoute('/(public)/_layout/_notauthenticated/')({
  component: HomePage,
  head: () => ({
    meta: seo({
      title: 'Platforma do uprawnień budowlanych – testy i symulator',
      titleSuffix: appName,
      keywords:
        'uprawnienia budowlane, egzamin na uprawnienia budowlane, testy uprawnienia budowlane, symulator egzaminu budowlanego, PIIB, IARP, nauka do egzaminu budowlanego, pytania egzaminacyjne budownictwo, przygotowanie do egzaminu budowlanego, platforma e-learningowa',
    }),
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(softwareApplicationSchema),
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify(faqPageSchema),
      },
    ],
  }),
})
