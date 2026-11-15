import { defineRule, type ESTree } from '@oxlint/plugins'

import { apiModuleDependencies } from '../../architecture-policy.ts'
import { normalizedPath } from './path.ts'

const layers = ['domain', 'application', 'infrastructure', 'http'] as const

type Layer = (typeof layers)[number]

const isLayer = (value: string | undefined): value is Layer => layers.some(layer => layer === value)

/** The file names each layer folder accepts; tests may sit in any layer. */
const roles: Record<Layer, { readonly pattern: RegExp; readonly description: string }> = {
  domain: {
    pattern: /^(?:[a-z0-9-]+\.(?:model|rules)|errors)\.ts$/,
    description: '<concept>.model.ts, <concept>.rules.ts and errors.ts',
  },
  application: {
    pattern: /^(?:[a-z0-9-]+\.(?:command|query|policy|reader|repository|service)|errors)\.ts$/,
    description:
      '<concept>.command.ts, .query.ts, .policy.ts, .reader.ts, .repository.ts, .service.ts and errors.ts',
  },
  infrastructure: {
    pattern: /^[a-z0-9-]+\.(?:reader|repository)\.postgres\.ts$/,
    description: '<concept>.reader.postgres.ts and <concept>.repository.postgres.ts',
  },
  http: {
    pattern: /^(?:(?:[a-z0-9-]+\.)?handlers|mappers|errors)\.ts$/,
    description:
      'handlers.ts (or <group>.handlers.ts per contract group), mappers.ts and errors.ts',
  },
}

/** Module layers each layer may import; dependencies point inward. */
const allowedLayers: Record<Layer, ReadonlyArray<Layer>> = {
  domain: ['domain'],
  application: ['domain', 'application'],
  infrastructure: ['domain', 'application', 'infrastructure'],
  http: layers,
}

const declaredModules: Record<string, ReadonlyArray<string>> = apiModuleDependencies

const modulePath = /\/apps\/api\/src\/modules\/([^/]+)\/(.+)$/

type Target =
  | { readonly kind: 'layer'; readonly module: string; readonly layer: string }
  | { readonly kind: 'lib' }
  | { readonly kind: 'middleware' }
  | { readonly kind: 'contracts' }
  | { readonly kind: 'sql' }
  | { readonly kind: 'transport' }
  | undefined

const resolveRelative = (directory: string, specifier: string) => {
  const parts = directory.split('/')

  for (const part of specifier.split('/')) {
    if (part === '..') {
      parts.pop()
    } else if (part !== '.') {
      parts.push(part)
    }
  }

  return parts.join('/')
}

const targetOf = (filename: string, source: string): Target => {
  if (source.startsWith('@inzpro/api-contracts')) {
    return { kind: 'contracts' }
  }

  if (source === 'effect/sql' || source.startsWith('effect/sql/')) {
    return { kind: 'sql' }
  }

  if (/^effect\/(?:http|http-api)(?:\/|$)/.test(source)) {
    return { kind: 'transport' }
  }

  const path = source.startsWith('~api/')
    ? `/apps/api/src/${source.slice('~api/'.length)}`
    : source.startsWith('.')
      ? resolveRelative(filename.slice(0, filename.lastIndexOf('/')), source)
      : undefined

  if (path === undefined) {
    return undefined
  }

  if (/\/apps\/api\/src\/lib\//.test(path)) {
    return { kind: 'lib' }
  }

  if (/\/apps\/api\/src\/middleware\//.test(path)) {
    return { kind: 'middleware' }
  }

  const match = path.match(modulePath)

  return match === null
    ? undefined
    : { kind: 'layer', module: match[1] ?? '', layer: match[2]?.split('/')[0] ?? '' }
}

/** Keeps API module files in their layer folders and their imports pointing inward. */
export const moduleLayersRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Place API module files in domain/application/infrastructure/http folders and keep dependencies pointing inward.',
    },
    schema: [],
    messages: {
      layer:
        'Place module files in a layer folder: domain/, application/, infrastructure/ or http/.',
      role: '{{layer}}/ holds {{roles}}.',
      inward:
        '{{layer}}/ must not import {{target}}: http → application → domain, and infrastructure implements application ports.',
      contracts:
        'Only http/ uses @inzpro/api-contracts. Map DTOs to module models in http/mappers.ts.',
      sql: '{{layer}}/ must not use effect/sql. SQL belongs in infrastructure/ adapters.',
      transport: '{{layer}}/ must not use HTTP. Transport belongs in http/.',
      module:
        '{{module}} must not depend on {{target}}. Module dependencies follow apiModuleDependencies in packages/tools/src/oxlint/architecture-policy.ts and must stay acyclic.',
      undeclared:
        'Declare module {{module}} and its dependencies in apiModuleDependencies (packages/tools/src/oxlint/architecture-policy.ts).',
    },
  },
  create(context) {
    const filename = normalizedPath(context.filename)
    const match = filename.match(modulePath)

    if (match === null) {
      return {}
    }

    const ownModule = match[1] ?? ''
    const permittedModules = declaredModules[ownModule]

    if (permittedModules === undefined) {
      return {
        Program(node) {
          context.report({ node, messageId: 'undeclared', data: { module: ownModule } })
        },
      }
    }

    const [folder, ...rest] = (match[2] ?? '').split('/')
    const name = rest.join('/')
    const test = /\.(?:test|spec)\.ts$/.test(filename)

    if (!isLayer(folder) || rest.length !== 1) {
      return {
        Program(node) {
          context.report({ node, messageId: 'layer' })
        },
      }
    }

    const layer = folder

    const check = (node: ESTree.Node, source: string, typeOnly: boolean) => {
      const target = targetOf(filename, source)

      if (
        target?.kind === 'layer' &&
        target.module !== ownModule &&
        !permittedModules.includes(target.module)
      ) {
        context.report({
          node,
          messageId: 'module',
          data: { module: ownModule, target: target.module },
        })

        return
      }

      if (target === undefined || layer === 'http') {
        return
      }

      if (target.kind === 'contracts') {
        context.report({ node, messageId: 'contracts' })
      } else if (target.kind === 'transport' || target.kind === 'middleware') {
        context.report({ node, messageId: 'transport', data: { layer } })
      } else if (target.kind === 'sql') {
        // Application ports name SQL failures as the cause of their read/write errors.
        if (layer === 'domain' || (layer === 'application' && !typeOnly)) {
          context.report({ node, messageId: 'sql', data: { layer } })
        }
      } else if (target.kind === 'lib') {
        if (layer === 'domain') {
          context.report({ node, messageId: 'inward', data: { layer, target: 'lib/' } })
        }
      } else if (
        !isLayer(target.layer) ||
        !allowedLayers[layer].includes(target.layer) ||
        (target.layer === 'infrastructure' && target.module !== ownModule)
      ) {
        context.report({
          node,
          messageId: 'inward',
          data: { layer, target: `${target.module}/${target.layer}/` },
        })
      }
    }

    return {
      Program(node) {
        if (!test && !roles[layer].pattern.test(name)) {
          context.report({
            node,
            messageId: 'role',
            data: { layer, roles: roles[layer].description },
          })
        }
      },
      ImportDeclaration(node) {
        if (test) {
          return
        }

        const typeOnly =
          node.importKind === 'type' ||
          (node.specifiers.length > 0 &&
            node.specifiers.every(
              specifier => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type',
            ))

        check(node, node.source.value, typeOnly)
      },
      ExportNamedDeclaration(node) {
        if (!test && node.source !== null) {
          check(node, node.source.value, node.exportKind === 'type')
        }
      },
    }
  },
})
