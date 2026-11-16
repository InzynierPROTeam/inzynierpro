import type { OralSessionPreview } from '@inzpro/api-contracts/modules/study/responses'
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
import {
  SessionDetail,
  SessionDetails,
  SessionPathDetail,
} from '~platform/components/session/SessionDetails'
import { QuestionCountDialog } from '~platform/features/learningSession/components/QuestionCountDialog'
import { getSessionQuestionCount } from '~platform/features/learningSession/utils'

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
      <CardContent>
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
      </CardContent>
      <CardFooter>
        <StartOralSessionButton
          categoryId={preview.category.id}
          questionCount={count}
        />
      </CardFooter>
    </Card>
  )
}
