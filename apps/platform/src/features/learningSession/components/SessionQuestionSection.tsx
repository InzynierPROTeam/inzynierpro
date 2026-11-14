import { BackLink } from '~platform/components/BackLink'

import { SessionQuestionCard } from './SessionQuestionCard'
import { WrittenSessionHeader } from './WrittenSessionHeader'

export const SessionQuestionSection = () => (
  <section className="app-layout-section @container gap-12 max-lg:pt-0!">
    <div className="flex flex-col gap-6">
      <BackLink fallback={{ to: '/nauka' }} />
      <WrittenSessionHeader />
    </div>
    <SessionQuestionCard />
  </section>
)
