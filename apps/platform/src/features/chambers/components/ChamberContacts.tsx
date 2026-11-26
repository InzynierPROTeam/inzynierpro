import { myChamberQueryOptions } from '@inzpro/queries/modules/preparation/queries'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { apiHttpClient } from '~platform/lib/api-client'

import { chambersRouteApi } from '../utils'
import { ChamberContactSection } from './ChamberContactSection'
import { DistrictChamberChooser } from './DistrictChamberChooser'

export const ChamberContacts = () => {
  const { session, selectedPath } = chambersRouteApi.useRouteContext()

  return (
    <SuspenseQueryWrapper>
      <SuspenseQuery
        isDataEmpty={() => false}
        options={myChamberQueryOptions(apiHttpClient, session.user.id, {
          params: { qualificationPathId: selectedPath.id },
        })}
      >
        {data => (
          <div className="flex flex-col gap-10">
            <SuspenseQueryWrapper>
              <DistrictChamberChooser
                key={`${selectedPath.id}:${selectedPath.districtChamber?.id ?? ''}`}
                generalChamberId={data.generalChamber.id}
              />
            </SuspenseQueryWrapper>
            {data.districtChamber && (
              <ChamberContactSection
                title="Izba okręgowa"
                chamber={data.districtChamber}
              />
            )}
            <ChamberContactSection
              title="Izba krajowa"
              chamber={data.generalChamber}
            />
          </div>
        )}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}
