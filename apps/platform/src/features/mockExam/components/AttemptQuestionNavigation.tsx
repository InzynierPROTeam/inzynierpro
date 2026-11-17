import type {
  AttemptQuestionState,
  MockExamAttempt,
} from '@inzpro/api-contracts/modules/mock-exams/responses'
import { mockExamAttemptQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import { buttonVariants } from '@inzpro/ui/components/button'
import { Link } from '@tanstack/react-router'
import { Clock } from 'lucide-react'
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
        {attempt.questions.map(state => (
          <li key={state.position}>
            <Link
              to="/egzamin-probny/podejscie/$attemptId/$questionNumber"
              params={{ attemptId: attempt.id, questionNumber: state.position }}
              resetScroll={false}
              replace
              aria-current={state.position === questionNumber ? 'step' : undefined}
              aria-label={questionLinkLabel(state)}
              className={buttonVariants({
                variant: 'outline',
                size: 'icon-md',
                className: cx(
                  'relative',
                  state.isAnswered &&
                    'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20',
                  state.position === questionNumber && 'border-primary text-primary',
                ),
              })}
            >
              {state.position}
              {state.isFlagged && (
                <Clock className="text-primary bg-background absolute -top-1 -right-1 size-3.5 rounded-full" />
              )}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  )
}

const questionLinkLabel = (state: AttemptQuestionState) =>
  `Pytanie ${state.position}, ${state.isAnswered ? 'z odpowiedzią' : 'bez odpowiedzi'}${state.isFlagged ? ', do powrotu' : ''}`
