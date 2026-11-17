import { BackLink } from '~platform/components/BackLink'

import { AbandonAttemptButton } from './AbandonAttemptButton'
import { AttemptHeader } from './AttemptHeader'
import { AttemptQuestionCard } from './AttemptQuestionCard'
import { AttemptQuestionNavigation } from './AttemptQuestionNavigation'
import { FinishAttemptButton } from './FinishAttemptButton'

export const AttemptSection = () => (
  <section className="app-layout-section @container gap-12">
    <BackLink fallback={{ to: '/egzamin-probny' }} />
    <AttemptHeader />
    <AttemptQuestionCard />
    <AttemptQuestionNavigation />
    <div className="flex flex-wrap items-center justify-center gap-3">
      <FinishAttemptButton />
      <AbandonAttemptButton />
    </div>
  </section>
)
