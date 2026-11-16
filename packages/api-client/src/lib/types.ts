import type { HttpApiEndpoint } from 'effect/http-api'

type RequestPart<Key extends string, Value> = [Value] extends [never]
  ? {}
  : { readonly [Part in Key]: Value }

export type InferEndpointRequest<Endpoint extends HttpApiEndpoint.ConstraintRequest> = RequestPart<
  'params',
  Endpoint['~Params']['Type']
> &
  RequestPart<'query', Endpoint['~Query']['Type']> &
  RequestPart<'payload', Endpoint['~Payload']['Type']> &
  RequestPart<'headers', Endpoint['~Headers']['Type']>
