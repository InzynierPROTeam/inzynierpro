import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'

import { Match, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

const script = fileURLToPath(new URL('../../scripts/wait-for-api.sh', import.meta.url))
const revision = '1234567890abcdef1234567890abcdef12345678'

describe('API release readiness', () => {
  it.each(['old', 'unhealthy', 'redirect', 'ready-after-retry', 'wrong-body', 'ready'])(
    '%s',
    async scenario => {
      let requests = 0

      const server = createServer((_request, response) => {
        requests += 1
        response.setHeader(
          'x-release-sha',
          scenario === 'old' || (scenario === 'ready-after-retry' && requests === 1)
            ? 'previous'
            : revision,
        )
        response.setHeader('content-type', 'application/json')
        response.statusCode = Match.value(scenario).pipe(
          Match.when('unhealthy', () => 503),
          Match.when('redirect', () => 302),
          Match.orElse(() => 200),
        )
        response.end(JSON.stringify({ status: scenario === 'wrong-body' ? 'starting' : 'ok' }))
      })

      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))

      const address = Schema.decodeUnknownSync(Schema.Struct({ port: Schema.Finite }))(
        server.address(),
      )

      const child = spawn('bash', [script, `http://127.0.0.1:${address.port}`, revision], {
        env: { ...process.env, RELEASE_MAX_ATTEMPTS: '2', RELEASE_POLL_INTERVAL: '0' },
        stdio: 'ignore',
      })

      const status = await new Promise<number | null>(resolve => child.on('exit', resolve))
      await new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve())),
      )

      expect(status).toBe(scenario.startsWith('ready') ? 0 : 1)
      expect(requests).toBe(scenario === 'ready' ? 1 : 2)
    },
  )
})
