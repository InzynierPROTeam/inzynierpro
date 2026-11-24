import { oralSessionQuestionQueryOptions } from '@inzpro/queries/modules/oral-study/queries'
import { Button } from '@inzpro/ui/components/button'
import { Card, CardContent, CardFooter, CardHeader } from '@inzpro/ui/components/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { RichText } from '@inzpro/ui/components/rich-text'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { Link } from '@tanstack/react-router'
import { FileQuestionMark } from 'lucide-react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { SessionQuestionWithdrawn } from '~platform/features/learningSession/components/SessionQuestionWithdrawn'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { OralFavoriteToggleButton } from '~platform/features/oralFavorites/components/OralFavoriteToggleButton'
import { OralQuestionNoteDialog } from '~platform/features/oralQuestionNotes/components/OralQuestionNoteDialog'
import { apiHttpClient } from '~platform/lib/api-client'

import { oralSessionQuestionRouteApi } from '../utils'
import { OralAnswerReveal } from './OralAnswerReveal'
import { OralSelfAssessmentActions } from './OralSelfAssessmentActions'

export const OralSessionQuestionCard = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId, questionNumber } = oralSessionQuestionRouteApi.useParams()

  return (
    <Card className="w-full max-w-3xl self-center">
      <SuspenseQueryWrapper fallback={<OralSessionQuestionSkeleton />}>
        <SuspenseQuery
          options={oralSessionQuestionQueryOptions(apiHttpClient, user.id, {
            params: { qualificationPathId: selectedPath.id, sessionId, position: questionNumber },
          })}
          isDataEmpty={question => question === null}
          noDataFallback={<MissingOralSessionQuestion />}
        >
          {question => (
            <>
              <CardHeader>
                <div className="flex justify-end gap-2">
                  <OralFavoriteToggleButton question={question} />
                  <OralQuestionNoteDialog
                    key={question.questionId}
                    question={question}
                  />
                </div>
                <h2 className="sr-only">Treść pytania</h2>
                <div className="text-base leading-relaxed font-medium">
                  <RichText
                    content={question.body.content}
                    assets={question.body.assets}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {question.isWithdrawn && question.selfAssessment === null && (
                  <SessionQuestionWithdrawn />
                )}
                <OralAnswerReveal
                  answer={question.answer}
                  references={question.references}
                />
              </CardContent>
              <CardFooter>
                <OralSelfAssessmentActions
                  key={question.position}
                  question={question}
                />
              </CardFooter>
            </>
          )}
        </SuspenseQuery>
      </SuspenseQueryWrapper>
    </Card>
  )
}

const OralSessionQuestionSkeleton = () => (
  <>
    <CardHeader>
      <TextSkeleton
        size="base"
        leading="relaxed"
        lines={2}
        className="max-w-xl"
      />
    </CardHeader>
    <CardContent>
      <Button
        variant="outline"
        disabled
      >
        Pokaż odpowiedź
      </Button>
    </CardContent>
  </>
)

const MissingOralSessionQuestion = () => (
  <CardContent>
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <IconWrapper>
            <FileQuestionMark />
          </IconWrapper>
        </EmptyMedia>
        <EmptyTitle>
          <h1>Nie znaleziono pytania</h1>
        </EmptyTitle>
        <EmptyDescription>
          Ta sesja nauki nie istnieje, należy do innej ścieżki lub nie ma pytania o tym numerze.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          nativeButton={false}
          render={<Link to="/ustny" />}
        >
          Wróć do kategorii
        </Button>
      </EmptyContent>
    </Empty>
  </CardContent>
)
