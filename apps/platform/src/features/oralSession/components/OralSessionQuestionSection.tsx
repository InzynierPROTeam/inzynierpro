import { BackLink } from '~platform/components/BackLink'

import { OralSessionActionsMenu } from './OralSessionActionsMenu'
import { OralSessionHeader } from './OralSessionHeader'
import { OralSessionQuestionCard } from './OralSessionQuestionCard'

export const OralSessionQuestionSection = () => (
  <section className="app-layout-section @container gap-12">
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <BackLink fallback={{ to: '/ustny' }} />
        <div className="max-lg:-mt-8">
          <OralSessionActionsMenu />
        </div>
      </div>
      <OralSessionHeader />
    </div>
    <OralSessionQuestionCard />
  </section>
)
