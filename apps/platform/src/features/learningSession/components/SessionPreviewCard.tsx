import type { GetSessionPreviewRes } from '@inzpro/api-client/modules/written-study'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@inzpro/ui/components/card'
import { List, Scale } from 'lucide-react'
import type React from 'react'
import { QuestionCountDialog } from '~platform/features/learningSession/components/QuestionCountDialog'
import {
  SessionDetail,
  SessionDetails,
  SessionPathDetail,
} from '~platform/features/learningSession/components/SessionDetails'
import { sessionPreviewRouteApi } from '~platform/features/learningSession/utils/session'
import { getSessionQuestionCount } from '~platform/features/learningSession/utils/session-question-count'

import { StartSessionButton } from './StartSessionButton'

type SessionPreviewCardProps = { preview: NonNullable<GetSessionPreviewRes> }

export const SessionPreviewCard: React.FC<SessionPreviewCardProps> = ({ preview }) => {
  const search = sessionPreviewRouteApi.useSearch()
  const navigate = sessionPreviewRouteApi.useNavigate()

  const count = getSessionQuestionCount(preview.settings, search['liczba-pytan'])

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Zacznij sesję nauki</h1>
        </CardTitle>
        <CardDescription>
          Poniżej znajdziesz szczegóły sesji nauki. Możesz ją przerwać w dowolnym momencie i wrócić
          do niej później.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SessionDetails>
          <SessionPathDetail />
          <SessionDetail
            icon={<Scale />}
            label="Kategoria"
          >
            {preview.document.title}
          </SessionDetail>
          <SessionDetail
            icon={<List />}
            label="Liczba pytań"
          >
            {count}
            {preview.settings.canChangeQuestionCount && (
              <QuestionCountDialog
                settings={preview.settings}
                count={count}
                onCountChange={questionCount =>
                  navigate({
                    search: previous => ({ ...previous, 'liczba-pytan': questionCount }),
                    replace: true,
                  })
                }
              />
            )}
          </SessionDetail>
        </SessionDetails>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
        <StartSessionButton
          documentId={preview.document.id}
          questionCount={count}
          questionSelection={preview.questionSelection}
          disabled={preview.availableQuestionCount === 0}
        />
        {preview.availableQuestionCount === 0 && (
          <p className="text-muted-foreground text-xs">
            Pytania dla tej kategorii nie są jeszcze dostępne.
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
