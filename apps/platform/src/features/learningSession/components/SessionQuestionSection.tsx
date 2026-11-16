import { BackLink } from '~platform/components/BackLink'

import { SessionActionsMenu } from './SessionActionsMenu'
import { SessionQuestionCard } from './SessionQuestionCard'
import { WrittenSessionHeader } from './WrittenSessionHeader'

export const SessionQuestionSection = () => (
  <section className="app-layout-section @container gap-12">
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <BackLink fallback={{ to: '/nauka' }} />
        <div className="max-lg:-mt-8">
          <SessionActionsMenu />
        </div>
      </div>
      <WrittenSessionHeader />
    </div>
    <SessionQuestionCard />
  </section>
)
