import { runApi } from '@inzpro/api-client/lib/run-api'
import {
  setDistrictChamber,
  type SetDistrictChamberRequest,
} from '@inzpro/api-client/modules/preparation'
import { apiHttpClient } from '~platform/lib/api-client'

export const updateDistrictChamber = (req: SetDistrictChamberRequest) =>
  runApi(setDistrictChamber(req), apiHttpClient)
