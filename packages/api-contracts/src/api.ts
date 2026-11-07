import { HttpApi } from 'effect/http-api'
import { V1Api } from '~api-contracts/v1-api.js'

export class Api extends HttpApi.make('api').addHttpApi(V1Api).prefix('/api') {}
