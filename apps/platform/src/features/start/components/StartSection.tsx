import { oralExamAccess, writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { hasExamAccess } from '@inzpro/utils/exam-access'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { ExamSessionTile } from './ExamSessionTile'
import { FavoritesTile } from './FavoritesTile'
import { MobileAppBanner } from './MobileAppBanner'
import { OralLearningTile } from './OralLearningTile'
import { OralReviewTile } from './OralReviewTile'
import { ReviewTile } from './ReviewTile'
import { SelectedPathTile } from './SelectedPathTile'
import { WrittenLearningTile } from './WrittenLearningTile'

export const StartSection = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()

  return (
    <section className="app-layout-section @container gap-12">
      <h1 className="sr-only">Start</h1>
      <MobileAppBanner />
      <div className="grid grid-cols-12 place-content-stretch gap-8 max-sm:gap-x-4">
        <SelectedPathTile />
        <ExamSessionTile />
        {hasExamAccess(selectedPath.accessScope, writtenExamAccess) && (
          <>
            <WrittenLearningTile />
            <ReviewTile />
            <FavoritesTile />
          </>
        )}
        {hasExamAccess(selectedPath.accessScope, oralExamAccess) && (
          <>
            <OralLearningTile />
            <OralReviewTile />
          </>
        )}
      </div>
    </section>
  )
}
