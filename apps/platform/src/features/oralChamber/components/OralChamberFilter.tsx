import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { reportedInMyChamberOralQuestionScope } from '@inzpro/domain/modules/oral-study/oral-study-session'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@inzpro/ui/components/dialog'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@inzpro/ui/components/item'
import { Switch } from '@inzpro/ui/components/switch'
import type React from 'react'
import { useId, useState } from 'react'
import { SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { DistrictChamberChooser } from '~platform/features/chambers/components/DistrictChamberChooser'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { useOralQuestionScope } from '../hooks/useOralQuestionScope'
import { oralChamberFilterStore } from '../utils'

type OralChamberFilterProps = { reportedQuestionCount: QuestionCount | null }

export const OralChamberFilter: React.FC<OralChamberFilterProps> = ({ reportedQuestionCount }) => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()
  const questionScope = useOralQuestionScope()
  const [isChooserOpen, setIsChooserOpen] = useState(false)
  const labelId = useId()

  const changeFilter = (enabled: boolean) =>
    selectedPath.districtChamber === null
      ? setIsChooserOpen(true)
      : oralChamberFilterStore.set(selectedPath.id, enabled)

  const enableAfterChoosing = () => {
    oralChamberFilterStore.set(selectedPath.id, true)
    setIsChooserOpen(false)
  }

  return (
    <Item
      variant="background-soft"
      className="w-full"
    >
      <ItemContent className="gap-1">
        <ItemTitle
          id={labelId}
          className="line-clamp-none"
        >
          Tylko pytania zgłoszone w mojej izbie
          {reportedQuestionCount !== null && ` (${reportedQuestionCount})`}
        </ItemTitle>
        <ItemDescription className="line-clamp-none text-xs">
          Na egzaminie mogą pojawić się także inne pytania z Twojej ścieżki.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Switch
          aria-labelledby={labelId}
          checked={questionScope === reportedInMyChamberOralQuestionScope}
          onCheckedChange={changeFilter}
        />
      </ItemActions>
      <Dialog
        open={isChooserOpen}
        onOpenChange={setIsChooserOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wybierz izbę okręgową</DialogTitle>
            <DialogDescription>
              Pokażemy pytania zgłoszone w izbie, w której zdajesz egzamin.
            </DialogDescription>
          </DialogHeader>
          <SuspenseQueryWrapper>
            <DistrictChamberChooser
              path={selectedPath}
              onSaved={enableAfterChoosing}
            />
          </SuspenseQueryWrapper>
        </DialogContent>
      </Dialog>
    </Item>
  )
}
