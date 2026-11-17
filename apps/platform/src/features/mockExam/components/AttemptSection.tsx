import { BackLink } from '~platform/components/BackLink'

import { AttemptHeader } from './AttemptHeader'
import { AttemptQuestionCard } from './AttemptQuestionCard'
import { AttemptQuestionNavigation } from './AttemptQuestionNavigation'

export const AttemptSection = () => (
  <section className="app-layout-section @container gap-12">
    <BackLink fallback={{ to: '/egzamin-probny' }} />
    <AttemptHeader />
    <AttemptQuestionCard />
    <AttemptQuestionNavigation />
  </section>
)
