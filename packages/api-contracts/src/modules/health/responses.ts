import { Schema } from 'effect'

export const HealthCheckResponse = Schema.Struct({
  status: Schema.Literal('ok'),
})

export type HealthCheckResponse = typeof HealthCheckResponse.Type
