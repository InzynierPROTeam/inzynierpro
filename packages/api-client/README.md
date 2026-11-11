# @inzpro/api-client

Reusable Effect actions and HTTP transport composition.

**Runtime:** Universal JavaScript with an HTTP client supplied by the consumer.

Keep actions as Effects until the Promise execution adapter runs them. Applications own environment values, credential adapters, and navigation after authentication failures. React and TanStack Query belong in their own packages.

## Actions

`apiAction` exposes the client generated from the contract; `runApi` provides the configured `HttpClient` and runs the Effect only at the Promise boundary. Timeouts and other transport rules belong to the HTTP client configuration.

Each action in `src/modules/<module>.ts` takes one `req` typed `InferEndpointRequest<typeof Endpoint>` and forwards it unchanged to the generated method. The request is inferred from the contract, never from the response schema. An endpoint without input declares `req: RequestType = {}`, explicitly typed so callers may omit it.

```ts
export const getSessionPreview = (req: GetSessionPreviewRequest) =>
  apiAction(api => api.Study.GetSessionPreview(req))

export type GetSessionPreviewRequest = InferEndpointRequest<typeof GetSessionPreviewEndpoint>
export type GetSessionPreviewRes = Effect.Success<ReturnType<typeof getSessionPreview>>
export type GetSessionPreviewError = Effect.Error<ReturnType<typeof getSessionPreview>>
```

When a contract starts requiring input, TypeScript rejects the `{}` default: remove it and pass the required request at call sites. Keep the inferred type intact rather than weakening it with assertions, `Partial` or optional fields.

## Usage

```ts
import { runApi } from '@inzpro/api-client/lib/run-api'
import { checkHealth } from '@inzpro/api-client/modules/health'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
