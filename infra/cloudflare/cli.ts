import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

import { Effect } from 'effect'

import { readDeploymentConfig } from './config.ts'

const [command, stage, ...extra] = process.argv.slice(2)

if (
  !['validate', 'validate-artifact', 'build', 'deploy', 'bootstrap'].includes(command ?? '') ||
  (stage !== 'staging' && stage !== 'prod') ||
  extra.length > 0
) {
  console.error(
    'Usage: pnpm cloudflare <validate|validate-artifact|build|deploy|bootstrap> <staging|prod>',
  )
  process.exit(1)
}

const config = Effect.runSync(
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
      VITE_GOOGLE_TAG_MANAGER_ID: process.env.VITE_GOOGLE_TAG_MANAGER_ID ?? '',
      VITE_META_PIXEL_ID: process.env.VITE_META_PIXEL_ID ?? '',
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
  const revision =
    process.env.GITHUB_SHA ??
    spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()

  if (!/^[a-f0-9]{40}$/.test(revision)) {
    console.error('A full commit SHA is required for the platform artifact.')
    process.exit(1)
  }

  const manifest = JSON.stringify({
    revision,
    stage,
    accountId: config.accountId,
    platform: config.platform.origin,
    api: config.api.origin,
    website: config.website.origin,
    cookiesDomain: config.cookiesDomain,
    gtm: process.env.VITE_GOOGLE_TAG_MANAGER_ID ?? '',
    pixel: process.env.VITE_META_PIXEL_ID ?? '',
  })

  if (command === 'build') {
    run(['exec', 'turbo', 'build', '--filter=@inzpro/platform...'])
    writeFileSync('apps/platform/dist/release.json', manifest)
  } else {
    const matches = Effect.runSync(
      Effect.try(() => readFileSync('apps/platform/dist/release.json', 'utf8')).pipe(
        Effect.match({ onFailure: () => false, onSuccess: contents => contents === manifest }),
      ),
    )

    if (
      !matches ||
      !existsSync('apps/platform/dist/server/index.js') ||
      !existsSync('apps/platform/dist/client')
    ) {
      console.error(
        'Platform artifact missing or does not match this revision, stage and configuration; build it first.',
      )
      process.exit(1)
    }
  }

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
