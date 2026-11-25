import { QuestionNotFound } from '@inzpro/api-contracts/modules/learning/errors'
import type { QuestionDetails } from '@inzpro/api-contracts/modules/written-study/responses'
import { questionDetailsQueryOptions } from '@inzpro/queries/modules/written-study/queries'
import {
  AnswerOption,
  AnswerOptionIndicator,
  AnswerOptionText,
} from '@inzpro/ui/components/answer-option'
import { RadioGroup } from '@inzpro/ui/components/radio-group'
import { RichText } from '@inzpro/ui/components/rich-text'
import { withAnswerLetters } from '@inzpro/utils/answer'
import { Schema } from 'effect'
import { Check } from 'lucide-react'
import type React from 'react'
import { BackLink } from '~platform/components/BackLink'
import {
  DefaultErrorFallback,
  SuspenseQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { QuestionFavoriteButton } from '~platform/features/favorites/components/QuestionFavoriteButton'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { QuestionDetailsNoteDialog } from '~platform/features/questionNotes/components/QuestionDetailsNoteDialog'
import { QuestionDetailsSkeleton } from '~platform/features/sources/components/QuestionDetailsSkeleton'
import { QuestionReferences } from '~platform/features/sources/components/QuestionReferences'
import { QuestionUnavailable } from '~platform/features/sources/components/QuestionUnavailable'
import { apiHttpClient } from '~platform/lib/api-client'

import { useSaveQuestionDetailsNote } from '../hooks/useSaveQuestionDetailsNote'
import { useToggleQuestionDetailsFavorite } from '../hooks/useToggleQuestionDetailsFavorite'
import { questionDetailsRouteApi } from '../utils'

export const QuestionDetailsSection = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { questionId } = questionDetailsRouteApi.useParams()

  return (
    <section className="app-layout-section @container gap-8">
      <BackLink fallback={{ to: '/nauka' }} />
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
          options={questionDetailsQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id, questionId },
          })}
          isDataEmpty={() => false}
        >
          {details => (
            <article className="flex flex-col gap-6">
              <header className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-sm">Pytanie pisemne</p>
                  <h1 className="text-xl font-semibold">{details.body}</h1>
                </div>
                <QuestionDetailsActions details={details} />
              </header>
              <RadioGroup
                aria-label="Odpowiedzi"
                value={details.answers.find(answer => answer.isCorrect)?.id ?? ''}
                disabled
                className="@container flex flex-col gap-3"
              >
                {withAnswerLetters(details.answers).map(([answer, letter]) => (
                  <AnswerOption
                    key={answer.id}
                    value={answer.id}
                    tone={answer.isCorrect ? 'correct' : 'neutral'}
                  >
                    <AnswerOptionIndicator>
                      {answer.isCorrect ? <Check aria-hidden /> : letter}
                    </AnswerOptionIndicator>
                    <AnswerOptionText>
                      {answer.text}
                      {answer.isCorrect && <span className="sr-only"> · Poprawna odpowiedź</span>}
                    </AnswerOptionText>
                  </AnswerOption>
                ))}
              </RadioGroup>
              <section
                aria-label="Wyjaśnienie"
                className="flex flex-col gap-2"
              >
                <h2 className="font-semibold">Wyjaśnienie</h2>
                <RichText
                  content={details.explanation.content}
                  assets={details.explanation.assets}
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

type QuestionDetailsActionsProps = { details: QuestionDetails }

const QuestionDetailsActions: React.FC<QuestionDetailsActionsProps> = ({ details }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const req = { params: { qualificationPathId: selectedPath.id, questionId: details.questionId } }
  const favorite = useToggleQuestionDetailsFavorite(user.id, req)
  const note = useSaveQuestionDetailsNote(user.id, req)

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
