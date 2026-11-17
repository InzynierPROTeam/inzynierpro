import type { MockExamAttempt } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { AttemptQuestionPosition } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { mockExamAttemptQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import { buttonVariants } from '@inzpro/ui/components/button'
import { Link } from '@tanstack/react-router'
import { Array as Arr } from 'effect'
import type React from 'react'
import { cx } from 'tailwind-variants'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { attemptQuestionRouteApi } from '../utils'

export const AttemptQuestionNavigation = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { attemptId } = attemptQuestionRouteApi.useParams()

  return (
    <SuspenseQueryWrapper fallback={null}>
      <SuspenseQuery
        options={mockExamAttemptQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id, attemptId },
        })}
        isDataEmpty={attempt => attempt === null}
        noDataFallback={null}
      >
        {attempt => <AttemptQuestionLinks attempt={attempt} />}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

type AttemptQuestionLinksProps = { attempt: MockExamAttempt }

const AttemptQuestionLinks: React.FC<AttemptQuestionLinksProps> = ({ attempt }) => {
  const { questionNumber } = attemptQuestionRouteApi.useParams()

  return (
    <nav
      aria-label="Pytania egzaminu"
      className="w-full max-w-3xl self-center"
    >
      <ol className="flex flex-wrap gap-2">
        {Arr.makeBy(attempt.questionCount, index => AttemptQuestionPosition.make(index + 1)).map(
          position => (
            <li key={position}>
              <Link
                to="/egzamin-probny/podejscie/$attemptId/$questionNumber"
                params={{ attemptId: attempt.id, questionNumber: position }}
                resetScroll={false}
                replace
                aria-current={position === questionNumber ? 'step' : undefined}
                aria-label={`Pytanie ${position}`}
                className={buttonVariants({
                  variant: 'outline',
                  size: 'icon-md',
                  className: cx(position === questionNumber && 'border-primary text-primary'),
                })}
              >
                {position}
              </Link>
            </li>
          ),
        )}
      </ol>
    </nav>
  )
}
