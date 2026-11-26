import type { OralSessionPreview } from '@inzpro/api-contracts/modules/oral-study/responses'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@inzpro/ui/components/card'
import { List, Mic2 } from 'lucide-react'
import type React from 'react'
import { QuestionCountDialog } from '~platform/features/learningSession/components/QuestionCountDialog'
import {
  SessionDetail,
  SessionDetails,
  SessionPathDetail,
} from '~platform/features/learningSession/components/SessionDetails'
import { getSessionQuestionCount } from '~platform/features/learningSession/utils/session-question-count'
import { OralChamberFilter } from '~platform/features/oralChamber/components/OralChamberFilter'

import { oralSessionPreviewRouteApi } from '../utils'
import { StartOralSessionButton } from './StartOralSessionButton'

type OralSessionPreviewCardProps = { preview: OralSessionPreview }

export const OralSessionPreviewCard: React.FC<OralSessionPreviewCardProps> = ({ preview }) => {
  const search = oralSessionPreviewRouteApi.useSearch()
  const navigate = oralSessionPreviewRouteApi.useNavigate()

  const count = getSessionQuestionCount(preview.settings, search['liczba-pytan'])

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Zacznij sesję nauki ustnej</h1>
        </CardTitle>
        <CardDescription>
          Odpowiedz na pytanie samodzielnie, odsłoń opracowanie i oceń, czy umiesz odpowiedzieć.
          Możesz przerwać sesję w dowolnym momencie i wrócić do niej później.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <SessionDetails>
          <SessionPathDetail />
          <SessionDetail
            icon={<Mic2 />}
            label="Kategoria"
          >
            {preview.category.name}
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
        <OralChamberFilter reportedQuestionCount={preview.reportedInMyChamberQuestionCount} />
      </CardContent>
      <CardFooter>
        <StartOralSessionButton
          categoryId={preview.category.id}
          questionCount={count}
          questionScope={preview.questionScope}
        />
      </CardFooter>
    </Card>
  )
}
