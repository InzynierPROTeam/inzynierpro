import { existsSync } from 'node:fs'

import { defineRule } from '@oxlint/plugins'

import {
  apiLayerRoles,
  contractFileRoles,
  contractFolderRoles,
  featureFileRoles,
  featureFolderRoles,
  platformFolderRoles,
  queryFileRoles,
  queryFolderRoles,
} from '../../source-role-policy.ts'
import { normalizedPath } from './path.ts'

type SourceRoles = Record<string, ReadonlyArray<string>>

const packageFolders = {
  'api-contracts': ['modules', 'utils', 'middleware', 'test'],
  'api-client': ['modules', 'lib', 'test'],
  queries: ['modules', 'lib', 'test'],
  domain: ['modules', 'common', 'test'],
  db: ['lib'],
  auth: [],
  'auth-client': [],
  config: [],
  email: ['templates', 'components', 'lib'],
  redis: [],
  utils: [],
  'browser-utils': [],
  'react-utils': ['hooks', 'tanstack-start', 'react-query'],
  'rich-content': [],
  ui: ['components', 'containers', 'hooks', 'side-effects', 'providers', 'styles', 'test'],
  testing: [],
  tools: ['oxlint', 'test'],
} satisfies SourceRoles

const pageComponent = /^[A-Z][A-Za-z0-9]*Page$/
const pageName = /^[A-Z][A-Za-z0-9]*Page\.tsx$/
const componentName = /^[A-Z][A-Za-z0-9]*\.tsx$/
const hookName = /^use[A-Z][A-Za-z0-9]*\.tsx?$/
const utilityName = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.(?:d|server|client))?\.ts$/
const sourceName = (name: string) => name.replace(/\.(?:test|spec)(?=\.[^.]+$)/, '')

const roleFileOrFolder = (
  parts: ReadonlyArray<string>,
  files: ReadonlyArray<string>,
  folders: ReadonlyArray<string>,
) =>
  parts.length === 1
    ? files.some(role => sourceName(parts[0] ?? '') === `${role}.ts`)
    : folders.includes(parts[0] ?? '') && utilityName.test(sourceName(parts.at(-1) ?? ''))

const frontendRole = (folder: string, filename: string) => {
  const name = sourceName(filename)

  if (pageName.test(name)) {
    return false
  }

  if (folder === 'components' || folder === 'providers' || folder === 'layout') {
    return componentName.test(name)
  }

  if (folder === 'hooks') {
    return hookName.test(name)
  }

  if (folder === 'test' || folder === 'assets' || folder === 'lib') {
    return utilityName.test(name) || componentName.test(name)
  }

  return utilityName.test(name)
}

const featureRole = (path: string) => {
  const parts = path.split('/')

  if (parts.length === 1) {
    return (
      pageName.test(sourceName(parts[0] ?? '')) ||
      featureFileRoles.some(role => sourceName(parts[0] ?? '') === `${role}.ts`)
    )
  }

  return (
    featureFolderRoles.includes(parts[0] ?? '') && frontendRole(parts[0] ?? '', parts.at(-1) ?? '')
  )
}

const collisionFor = (filename: string) => {
  const path = normalizedPath(filename)
  const feature = path.match(/^(.*\/apps\/[^/]+\/src\/features\/[^/]+)\/(.+)$/)
  const contracts = path.match(/^(.*\/packages\/api-contracts\/src\/modules\/[^/]+)\/(.+)$/)
  const queries = path.match(/^(.*\/packages\/queries\/src\/modules\/[^/]+)\/(.+)$/)
  const client = path.match(/^(.*\/packages\/api-client\/src\/modules)\/([^/]+)(?:\/(.+))?$/)
  const subject = feature ?? contracts ?? queries

  if (subject !== null) {
    const roles =
      feature !== null
        ? featureFileRoles
        : contracts !== null
          ? contractFolderRoles
          : queryFolderRoles

    const role = sourceName(subject[2]?.split('/')[0] ?? '').replace(/\.ts$/, '')

    if (
      roles.includes(role) &&
      existsSync(`${subject[1]}/${role}.ts`) &&
      existsSync(`${subject[1]}/${role}`)
    ) {
      return `${role}.ts and ${role}/`
    }
  }

  if (client !== null) {
    const module = sourceName(client[2] ?? '').replace(/\.ts$/, '')

    if (existsSync(`${client[1]}/${module}.ts`) && existsSync(`${client[1]}/${module}`)) {
      return `${module}.ts and ${module}/`
    }
  }

  return undefined
}

const expectedRole = (filename: string) => {
  const path = normalizedPath(filename)
  const packageMatch = path.match(/\/packages\/([^/]+)\/src\/(.+)$/)

  if (packageMatch !== null) {
    const workspace = packageMatch[1] ?? ''
    const relative = packageMatch[2] ?? ''
    const parts = relative.split('/')

    if (parts[0] === 'modules') {
      const role = parts.slice(2)

      if (
        workspace === 'api-contracts' &&
        !roleFileOrFolder(role, contractFileRoles, contractFolderRoles)
      ) {
        return 'modules/<module>/{api,requests,responses,errors}.ts or requests/, responses/, errors/, endpoints/ topic files'
      }

      if (workspace === 'queries' && !roleFileOrFolder(role, queryFileRoles, queryFolderRoles)) {
        return 'modules/<module>/{keys,queries}.ts or queries/<topic>.ts'
      }

      if (
        workspace === 'api-client' &&
        (parts.length < 2 ||
          !utilityName.test(sourceName(parts.at(-1) ?? '')) ||
          sourceName(parts.at(-1) ?? '') === 'actions.ts')
      ) {
        return 'modules/<module>.ts or modules/<module>/<topic>.ts'
      }

      if (
        workspace === 'domain' &&
        (parts.length < 3 || !utilityName.test(sourceName(parts.at(-1) ?? '')))
      ) {
        return 'modules/<module>/<concept>.ts with optional topic folders and adjacent tests'
      }
    }

    const folders = Object.entries(packageFolders).find(([name]) => name === workspace)?.[1]

    if (folders !== undefined && parts.length > 1 && !folders.some(folder => folder === parts[0])) {
      return folders.length === 0 ? 'flat source files' : `source folders: ${folders.join(', ')}`
    }

    if (workspace === 'api-contracts' && parts[0] === 'middleware') {
      if (
        parts.length !== 3 ||
        !['api.ts', 'current-user.ts', 'errors.ts'].includes(sourceName(parts[2] ?? ''))
      ) {
        return 'middleware/<middleware>/{api,current-user,errors}.ts with adjacent tests'
      }
    }

    if (['api-contracts', 'api-client', 'queries'].includes(workspace) && parts.length === 1) {
      if (
        workspace !== 'api-contracts' ||
        !['api.ts', 'v1-api.ts'].includes(sourceName(relative))
      ) {
        return 'module files in modules/ and shared helpers in lib/ or utils/'
      }
    }
  }

  const feature = path.match(/\/apps\/[^/]+\/src\/features\/[^/]+\/(.+)$/)

  if (feature !== null && !featureRole(feature[1] ?? '')) {
    return 'root *Page.tsx, role.ts or role/**, and nested components/, hooks/, lib/, providers/, styles/, assets/, test/; pages belong only at the feature root'
  }

  const application = path.match(/\/apps\/(api|platform)\/src\/(.+)$/)

  if (application !== null) {
    const app = application[1]
    const relative = application[2] ?? ''
    const parts = relative.split('/')
    const folder = parts[0] ?? ''

    const folders =
      app === 'api'
        ? ['lib', 'middleware', 'migrations', 'modules', 'seed', 'test', 'worker']
        : platformFolderRoles

    const roots =
      app === 'api'
        ? ['api.ts', 'http.ts', 'main.ts']
        : ['router.tsx', 'routeTree.gen.ts', 'vite-env.d.ts']

    if (parts.length === 1 ? !roots.includes(sourceName(relative)) : !folders.includes(folder)) {
      return `application entry files or source folders: ${folders.join(', ')}`
    }

    if (
      app === 'api' &&
      folder === 'lib' &&
      apiLayerRoles.infrastructure.pattern.test(sourceName(parts.at(-1) ?? ''))
    ) {
      return 'repository, reader and service adapters in the owning module infrastructure/'
    }

    if (
      app === 'platform' &&
      parts.length > 1 &&
      !['features', 'routes'].includes(folder) &&
      !frontendRole(folder, parts.at(-1) ?? '')
    ) {
      return 'nested files named for their global role; *Page.tsx belongs only at the root of a feature'
    }

    if (
      app === 'api' &&
      folder === 'migrations' &&
      (parts.length !== 2 || !/^\d{4}_[a-z0-9_]+\.ts$/.test(parts[1] ?? ''))
    ) {
      return 'flat, ordered migrations named NNNN_responsibility.ts'
    }
  }

  return undefined
}

export const fileRolesRule = defineRule({
  meta: {
    type: 'problem',
    docs: { description: 'Enforce source file roles and module layouts across the workspace.' },
    schema: [],
    messages: {
      role: 'Place this file according to its responsibility: {{expected}}. Extend the source-role policy and its regression tests for a new responsibility.',
      collision: 'Choose a single role representation: {{paths}} must not coexist.',
      page: 'Declare page components in *Page.tsx at the feature root.',
    },
  },
  create(context) {
    const expected = expectedRole(context.filename)
    const collision = collisionFor(context.filename)

    const featureRootPage =
      /\/features\/[^/]+\/[A-Z][A-Za-z0-9]*Page(?:\.(?:test|spec))?\.tsx$/.test(
        normalizedPath(context.filename),
      )

    const platformSource = /\/apps\/platform\/src\//.test(normalizedPath(context.filename))

    return {
      Program(node) {
        if (expected !== undefined) {
          context.report({ node, messageId: 'role', data: { expected } })
        }

        if (collision !== undefined) {
          context.report({ node, messageId: 'collision', data: { paths: collision } })
        }
      },
      FunctionDeclaration(node) {
        if (platformSource && !featureRootPage && pageComponent.test(node.id?.name ?? '')) {
          context.report({ node, messageId: 'page' })
        }
      },
      VariableDeclarator(node) {
        if (
          platformSource &&
          !featureRootPage &&
          node.id.type === 'Identifier' &&
          pageComponent.test(node.id.name) &&
          (node.init?.type === 'ArrowFunctionExpression' ||
            node.init?.type === 'FunctionExpression')
        ) {
          context.report({ node, messageId: 'page' })
        }
      },
    }
  },
})
