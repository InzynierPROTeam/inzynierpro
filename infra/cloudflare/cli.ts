import { spawnSync } from 'node:child_process'

import { Effect } from 'effect'

import { readDeploymentConfig } from './config.ts'

const [command, stage, ...extra] = process.argv.slice(2)

if (
  !['validate', 'build', 'deploy', 'bootstrap'].includes(command ?? '') ||
  (stage !== 'staging' && stage !== 'prod') ||
  extra.length > 0
) {
  console.error('Usage: pnpm cloudflare <validate|build|deploy|bootstrap> <staging|prod>')
  process.exit(1)
}

Effect.runSync(
  readDeploymentConfig(process.env).pipe(
    Effect.match({
      onFailure: () => {
        console.error('Invalid deployment configuration. See infra/cloudflare/README.md.')
        process.exit(1)
      },
      onSuccess: value => value,
    }),
  ),
)

const run = (args: string[]) => {
  const result = spawnSync('pnpm', args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      VITE_IS_DEV: 'false',
      ALCHEMY_STAGE: stage,
      // Never let plan/deploy silently bootstrap or upgrade the state store.
      CI: command === 'bootstrap' ? 'false' : 'true',
    },
  })

  if (result.error || result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

if (command === 'validate') {
  console.log(`Configuration valid for ${stage}`)
} else if (command === 'bootstrap') {
  if (process.env.CI) {
    console.error('State bootstrap must run separately from CI.')
    process.exit(1)
  }

  run([
    'exec',
    'alchemy',
    'state',
    'bootstrap',
    '--backend',
    'cloudflare',
    '--name',
    'inzpro-state',
  ])
} else {
  run(['exec', 'turbo', 'build', '--filter=@inzpro/platform...'])

  if (command === 'deploy') {
    run([
      'exec',
      'alchemy',
      'deploy',
      '--config',
      'infra/cloudflare/alchemy.run.ts',
      '--stage',
      stage,
      '--yes',
    ])
  }
}
