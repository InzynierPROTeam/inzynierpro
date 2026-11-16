import { Schema } from 'effect'

export const errorFields = <const Type extends readonly [string, ...string[]]>(...types: Type) => ({
  message: Schema.NonEmptyString,
  type: Schema.Literals(types),
})

export const BadRequestAnnotations = () => ({
  httpApiStatus: 400,
  description: 'The request was invalid or cannot be otherwise served',
})

export const UnauthorizedAnnotations = () => ({
  httpApiStatus: 401,
  description: 'Authentication is required and has failed or has not been provided',
})

export const PaymentRequiredAnnotations = () => ({
  httpApiStatus: 402,
  description: 'Payment is required to proceed',
})

export const ForbiddenAnnotations = () => ({
  httpApiStatus: 403,
  description: 'The server understood the request but refuses to authorize it',
})

export const NotFoundAnnotations = () => ({
  httpApiStatus: 404,
  description: 'The requested resource could not be found',
})

export const MethodNotAllowedAnnotations = () => ({
  httpApiStatus: 405,
  description: 'The method specified in the request is not allowed for the resource',
})

export const NotAcceptableAnnotations = () => ({
  httpApiStatus: 406,
  description:
    'The resource identified by the request is only capable of generating response entities which have content characteristics not acceptable according to the accept headers sent in the request',
})

export const ProxyAuthenticationRequiredAnnotations = () => ({
  httpApiStatus: 407,
  description: 'The client must first authenticate itself with the proxy',
})

export const RequestTimeoutAnnotations = () => ({
  httpApiStatus: 408,
  description: 'The server timed out waiting for the request',
})

export const ConflictAnnotations = () => ({
  httpApiStatus: 409,
  description: 'The resource already exists',
})

export const GoneAnnotations = () => ({
  httpApiStatus: 410,
  description: 'The requested resource is no longer available and will not be available again',
})

export const LengthRequiredAnnotations = () => ({
  httpApiStatus: 411,
  description:
    'The request did not specify the length of its content, which is required by the requested resource',
})

export const PreconditionFailedAnnotations = () => ({
  httpApiStatus: 412,
  description:
    'The server does not meet one of the preconditions that the requester put on the request',
})

export const PayloadTooLargeAnnotations = () => ({
  httpApiStatus: 413,
  description: 'The request is larger than the server is willing or able to process',
})

export const URITooLongAnnotations = () => ({
  httpApiStatus: 414,
  description: 'The URI provided was too long for the server to process',
})

export const UnsupportedMediaTypeAnnotations = () => ({
  httpApiStatus: 415,
  description: 'The request entity has a media type which the server or resource does not support',
})

export const RangeNotSatisfiableAnnotations = () => ({
  httpApiStatus: 416,
  description:
    'The client has asked for a portion of the file, but the server cannot supply that portion',
})

export const ExpectationFailedAnnotations = () => ({
  httpApiStatus: 417,
  description: 'The server cannot meet the requirements of the Expect request-header field',
})

export const UnprocessableEntityAnnotations = () => ({
  httpApiStatus: 422,
  description: 'The request was well-formed but was unable to be followed due to semantic errors',
})

export const TooEarlyAnnotations = () => ({
  httpApiStatus: 425,
  description: 'The server is unwilling to risk processing a request that might be replayed',
})

export const TooManyRequestsAnnotations = () => ({
  httpApiStatus: 429,
  description: 'The user has sent too many requests in a given amount of time',
})

export const RequestHeaderFieldsTooLargeAnnotations = () => ({
  httpApiStatus: 431,
  description:
    'The server is unwilling to process the request because either an individual header field, or all the header fields collectively, are too large',
})

export const UnavailableForLegalReasonsAnnotations = () => ({
  httpApiStatus: 451,
  description: 'The server is denying access to the resource as a consequence of a legal demand',
})

export const InternalServerErrorAnnotations = () => ({
  httpApiStatus: 500,
  description: "The server has encountered a situation it doesn't know how to handle",
})

export const NotImplementedAnnotations = () => ({
  httpApiStatus: 501,
  description: 'The request method is not supported by the server and cannot be handled',
})

export const BadGatewayAnnotations = () => ({
  httpApiStatus: 502,
  description:
    'The server, while acting as a gateway or proxy, received an invalid response from the upstream server',
})

export const ServiceUnavailableAnnotations = () => ({
  httpApiStatus: 503,
  description: 'The server is not ready to handle the request',
})

export const GatewayTimeoutAnnotations = () => ({
  httpApiStatus: 504,
  description:
    'The server, while acting as a gateway or proxy, did not get a response in time from the upstream server',
})

export const HTTPVersionNotSupportedAnnotations = () => ({
  httpApiStatus: 505,
  description: 'The HTTP version used in the request is not supported by the server',
})

// Framework failures, kept separate from each endpoint's declared errors.
export class InvalidRequest extends Schema.TaggedError<
  InvalidRequest,
  { readonly brand: unique symbol }
>()('InvalidRequest', errorFields('invalid_request'), BadRequestAnnotations()) {}

export class RouteNotFound extends Schema.TaggedError<
  RouteNotFound,
  { readonly brand: unique symbol }
>()('RouteNotFound', errorFields('route_not_found'), NotFoundAnnotations()) {}

export class InternalServerError extends Schema.TaggedError<
  InternalServerError,
  { readonly brand: unique symbol }
>()(
  'InternalServerError',
  errorFields('internal_server_error'),
  InternalServerErrorAnnotations(),
) {}

// Shared by every rate-limited endpoint; `retry-after` and `x-ratelimit-*` headers carry the timing.
export class RateLimitExceeded extends Schema.TaggedError<
  RateLimitExceeded,
  { readonly brand: unique symbol }
>()('RateLimitExceeded', errorFields('rate_limit_exceeded'), TooManyRequestsAnnotations()) {}
