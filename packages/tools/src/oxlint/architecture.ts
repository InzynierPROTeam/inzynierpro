import { existsSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { dirname, join, resolve } from 'node:path'

import { definePlugin, defineRule, type ESTree } from '@oxlint/plugins'
import { Predicate } from 'effect'

import {
  applicationDependencies,
  packageDependencies,
  universalPackages,
} from './architecture-policy.ts'
import { noReexports } from './no-reexports.ts'

type Workspace = { root: string; group: 'apps' | 'packages'; name: string }

function workspaceOf(filename: string): Workspace | null {
  const match = /^(.*?)\/(apps|packages)\/([^/]+)(?:\/|$)/.exec(filename.replaceAll('\\', '/'))
  const root = match?.[1]
  const group = match?.[2]
  const name = match?.[3]

  if (root === undefined || name === undefined || (group !== 'apps' && group !== 'packages')) {
    return null
  }

  return { root, group, name }
}

// Test files, plus test support code kept in a workspace's `src/test` directory.
const isTest = (path: string) =>
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(path) || /[\\/]src[\\/]test[\\/]/.test(path)

// Relative and `~workspace/` alias imports are compared by their path inside the workspace.
const isTestSource = (filename: string, source: string) =>
  isTest(
    source.startsWith('.')
      ? resolve(dirname(filename), source)
      : source.replace(/^~[^/]+\//, '/src/'),
  )

const nodeModules = new Set(builtinModules.map(name => name.replace(/^node:/, '')))

function literalValue(node: ESTree.Node): string | null {
  if (node.type === 'Literal' && Predicate.isString(node.value)) {
    return node.value
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? null
  }

  return null
}

export const workspaceImports = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce workspace ownership, dependency directions and runtime boundaries.',
    },
    schema: [],
    messages: {
      unregistered: 'Add {{workspace}} to the architecture policy before adding source files.',
      dependency: '{{from}} cannot import {{to}}. Follow the workspace dependency policy.',
      packagePath: 'Import another workspace through its @inzpro package name.',
      platform: 'Keep platform libraries and Node built-ins outside universal package sources.',
      testOnly: 'Import test files and shared test adapters only from tests.',
    },
  },
  create(context) {
    const filename = context.filename
    const owner = workspaceOf(filename)

    if (!owner) {
      return {}
    }

    const allowed =
      owner.group === 'packages'
        ? Object.entries(packageDependencies).find(([name]) => name === owner.name)?.[1]
        : Object.entries(applicationDependencies).find(([name]) => name === owner.name)?.[1]

    if (!allowed && !existsSync(join(owner.root, owner.group, owner.name, 'package.json'))) {
      return {}
    }

    const universal =
      owner.group === 'packages' && universalPackages.some(name => name === owner.name)

    const check = (node: ESTree.Node, source: string) => {
      if (universal && filename.includes('/src/')) {
        const platform = /^(react($|[-/])|expo($|[-/])|@expo\/|@tanstack\/react-)/.test(source)
        const builtin = nodeModules.has(source.replace(/^node:/, ''))

        if (platform || (builtin && !isTest(filename))) {
          context.report({ node, messageId: 'platform' })

          return
        }
      }

      let target: Workspace | null = null
      const packageName = /^@inzpro\/([^/]+)/.exec(source)?.[1]
      const alias = /^~([^/]+)/.exec(source)?.[1]

      if (packageName || alias) {
        const name = packageName ?? alias

        if (!name) {
          return
        }

        target = {
          root: owner.root,
          group: Object.hasOwn(applicationDependencies, name) ? 'apps' : 'packages',
          name,
        }
      } else if (source.startsWith('.') || source.startsWith('/')) {
        target = workspaceOf(resolve(dirname(filename), source))
      }

      if (
        !isTest(filename) &&
        (isTestSource(filename, source) || (target?.name === 'testing' && owner.name !== 'testing'))
      ) {
        context.report({ node, messageId: 'testOnly' })

        return
      }

      if (!target || (target.group === owner.group && target.name === owner.name)) {
        return
      }

      if (
        target.group === 'apps' ||
        (!allowed?.some(name => name === target.name) &&
          !(target.name === 'testing' && isTest(filename)))
      ) {
        context.report({
          node,
          messageId: 'dependency',
          data: { from: owner.name, to: target.name },
        })

        return
      }

      if (!packageName) {
        context.report({ node, messageId: 'packagePath' })
      }
    }

    return {
      Program(node) {
        if (!allowed && existsSync(join(owner.root, owner.group, owner.name, 'package.json'))) {
          context.report({
            node,
            messageId: 'unregistered',
            data: { workspace: `${owner.group}/${owner.name}` },
          })
        }
      },
      ImportDeclaration(node) {
        check(node, node.source.value)
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          check(node, node.source.value)
        }
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value)
      },
      ImportExpression(node) {
        const source = literalValue(node.source)

        if (source !== null) {
          check(node, source)
        }
      },
      TSImportType(node) {
        check(node, node.source.value)
      },
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments[0]
        ) {
          const source = literalValue(node.arguments[0])

          if (source !== null) {
            check(node, source)
          }
        }
      },
    }
  },
})

export default definePlugin({
  meta: { name: 'architecture' },
  rules: { 'workspace-imports': workspaceImports, 'no-reexports': noReexports },
})
