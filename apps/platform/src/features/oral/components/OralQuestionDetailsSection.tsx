import { QuestionNotFound } from '@inzpro/api-contracts/modules/learning/errors'
import type { OralQuestionDetails } from '@inzpro/api-contracts/modules/oral-study/responses'
import { oralQuestionDetailsQueryOptions } from '@inzpro/queries/modules/oral-study/queries'
import { RichText } from '@inzpro/ui/components/rich-text'
import { Schema } from 'effect'
import type React from 'react'
import { BackLink } from '~platform/components/BackLink'
import {
  DefaultErrorFallback,
  SuspenseQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { QuestionFavoriteButton } from '~platform/features/favorites/components/QuestionFavoriteButton'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { MyChamberSourceBadges } from '~platform/features/oralChamber/components/MyChamberSourceBadges'
import { QuestionDetailsNoteDialog } from '~platform/features/questionNotes/components/QuestionDetailsNoteDialog'
import { QuestionDetailsSkeleton } from '~platform/features/sources/components/QuestionDetailsSkeleton'
import { QuestionReferences } from '~platform/features/sources/components/QuestionReferences'
import { QuestionUnavailable } from '~platform/features/sources/components/QuestionUnavailable'
import { apiHttpClient } from '~platform/lib/api-client'

import { useSaveOralQuestionDetailsNote } from '../hooks/useSaveOralQuestionDetailsNote'
import { useToggleOralQuestionDetailsFavorite } from '../hooks/useToggleOralQuestionDetailsFavorite'
import { oralQuestionDetailsRouteApi } from '../utils'

export const OralQuestionDetailsSection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { questionId } = oralQuestionDetailsRouteApi.useParams()

  return (
    <section className="app-layout-section @container gap-8">
      <BackLink fallback={{ to: '/ustny' }} />
      <SuspenseQueryWrapper
        fallback={<QuestionDetailsSkeleton />}
        errorFallback={props =>
          Schema.is(QuestionNotFound)(props.error) ? (
            <QuestionUnavailable />
          ) : (
            <DefaultErrorFallback {...props} />
          )
        }
      >
        <SuspenseQuery
          options={oralQuestionDetailsQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id, questionId },
          })}
          isDataEmpty={() => false}
        >
          {details => (
            <article className="flex flex-col gap-6">
              <header className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-sm">Pytanie ustne</p>
                  <MyChamberSourceBadges sourceKinds={details.myChamberSourceKinds} />
                  <h1 className="text-xl font-semibold">
                    <RichText
                      content={details.body.content}
                      assets={details.body.assets}
                    />
                  </h1>
                </div>
                <OralQuestionDetailsActions details={details} />
              </header>
              <section
                aria-label="Przygotowana odpowiedź"
                className="flex flex-col gap-2"
              >
                <h2 className="font-semibold">Przygotowana odpowiedź</h2>
                <RichText
                  content={details.answer.content}
                  assets={details.answer.assets}
                />
              </section>
              <QuestionReferences references={details.references} />
            </article>
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </section>
  )
}

type OralQuestionDetailsActionsProps = { details: OralQuestionDetails }

const OralQuestionDetailsActions: React.FC<OralQuestionDetailsActionsProps> = ({ details }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const req = { params: { qualificationPathId: selectedPath.id, questionId: details.questionId } }
  const favorite = useToggleOralQuestionDetailsFavorite(user.id, req)
  const note = useSaveOralQuestionDetailsNote(user.id, req)

  return (
    <div className="flex shrink-0 gap-2">
      <QuestionFavoriteButton
        isFavorite={details.isFavorite}
        disabled={favorite.isPending}
        onToggle={favorite.mutate}
      />
      <QuestionDetailsNoteDialog
        note={details.note}
        isSaving={note.isPending}
        onSave={note.mutateAsync}
      />
    </div>
  )
}
