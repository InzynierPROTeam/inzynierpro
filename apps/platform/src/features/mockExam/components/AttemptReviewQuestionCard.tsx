import type { AttemptReviewQuestion } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { mockExamAttemptQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import {
  AnswerOption,
  AnswerOptionIndicator,
  AnswerOptionText,
} from '@inzpro/ui/components/answer-option'
import { Badge } from '@inzpro/ui/components/badge'
import { Card, CardContent, CardHeader } from '@inzpro/ui/components/card'
import { RadioGroup } from '@inzpro/ui/components/radio-group'
import { withAnswerLetters } from '@inzpro/utils/answer'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import type React from 'react'
import { SessionAnswerExplanation } from '~platform/features/learningSession/components/SessionAnswerExplanation'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { attemptSummaryRouteApi } from '../utils'
import { AttemptReviewActions } from './AttemptReviewActions'

type AttemptReviewQuestionCardProps = { question: AttemptReviewQuestion }

export const AttemptReviewQuestionCard: React.FC<AttemptReviewQuestionCardProps> = ({
  question,
}) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { attemptId } = attemptSummaryRouteApi.useParams()

  const { data: attempt } = useSuspenseQuery(
    mockExamAttemptQueryOptions(apiHttpClient, user.id, {
      params: { qualificationPathId: selectedPath.id, attemptId },
    }),
  )

  return (
    <article>
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Pytanie {question.position}</span>
              <Badge variant="secondary">
                {attempt?.sections.find(section => section.position === question.section)?.name}
              </Badge>
            </div>
            <AttemptReviewActions question={question} />
          </div>
          <h3 className="leading-relaxed font-medium">{question.body}</h3>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {question.isWithdrawn && (
            <p className="text-muted-foreground text-sm">
              Pytanie wycofane — wynik tego podejścia jest niepełny.
            </p>
          )}
          {question.selectedAnswerId === null && (
            <p className="text-muted-foreground text-sm">Bez odpowiedzi</p>
          )}
          <RadioGroup
            aria-label={`Odpowiedzi do pytania ${question.position}`}
            value={question.selectedAnswerId ?? ''}
            disabled
            className="@container flex flex-col gap-3"
          >
            {withAnswerLetters(question.answers).map(([answer, letter]) => {
              const correct = answer.id === question.correctAnswerId
              const selected = answer.id === question.selectedAnswerId

              return (
                <AnswerOption
                  key={answer.id}
                  value={answer.id}
                  tone={
                    correct
                      ? question.selectedAnswerId === null
                        ? 'primary'
                        : 'correct'
                      : selected
                        ? 'incorrect'
                        : 'neutral'
                  }
                >
                  <AnswerOptionIndicator>
                    {correct ? <Check aria-hidden /> : selected ? <X aria-hidden /> : letter}
                  </AnswerOptionIndicator>
                  <AnswerOptionText>
                    {answer.text}
                    {correct && <span className="sr-only"> · Poprawna odpowiedź</span>}
                    {selected && <span className="sr-only"> · Twoja odpowiedź</span>}
                  </AnswerOptionText>
                </AnswerOption>
              )
            })}
          </RadioGroup>
          <div className="flex flex-col gap-3">
            <h4 className="text-muted-foreground text-sm font-medium">Wyjaśnienie</h4>
            <SessionAnswerExplanation explanation={question.explanation} />
          </div>
          {question.note && (
            <div className="bg-muted/40 rounded-xl p-4">
              <h4 className="mb-2 text-sm font-medium">Twoja notatka</h4>
              {question.note.refersToEarlierWording && (
                <p className="text-muted-foreground mb-2 text-xs">
                  Notatka może dotyczyć innego brzmienia pytania.
                </p>
              )}
              <p className="text-sm whitespace-pre-wrap">{question.note.text}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </article>
  )
}
