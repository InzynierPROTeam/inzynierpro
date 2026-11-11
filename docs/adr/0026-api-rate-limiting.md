# API rate limiting

Our API endpoints are limited with a token bucket in Redis, ported from V1 to `@inzpro/redis/rate-limiter`. A Lua script consumes a token atomically, and a rejected request does not drain the bucket. Sign-in and codes stay under Better Auth's limits, which keep counters in the same Redis (ADR-0011).

Each handler calls its limit explicitly before doing work, as in V1, rather than through middleware declared in the contract. There are three tiers: public catalog reads per client address, signed-in reads per account and writes per account. Signed-in users are counted by account ID, not IP, because many people behind one NAT would share a limit. Keys and telemetry hold a hash of the identifier, never the raw address or ID. An exceeded limit returns 429 `RateLimitExceeded` with `retry-after` and `x-ratelimit-*` headers, and the operation's span records the policy and the rejection.

When Redis is unavailable, reads continue with a warning in the log and on the span, and writes fail with a server error. Signed-in reads need a Redis-backed session anyway (ADR-0011), so in practice fail-open covers the public catalog.

The client address comes only from the header named in `TRUSTED_CLIENT_IP_HEADER`, `cf-connecting-ip` in production. The header is trustworthy only when the origin accepts traffic exclusively from Cloudflare; without configuration the socket address is used. Better Auth uses the same header; without it, its sign-in limits put every client on one counter. A Cloudflare WAF rate-limiting rule protects the whole API against floods.
