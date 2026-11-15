import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import {
  apiModuleDependencies,
  applicationDependencies,
  packageDependencies,
} from './architecture-policy.ts'

type Graph = Readonly<Record<string, ReadonlyArray<string>>>

/** Returns the first dependency cycle as a path that starts and ends at the same node. */
const findCycle = (graph: Graph) => {
  const done = new Set<string>()

  const visit = (node: string, path: ReadonlyArray<string>): ReadonlyArray<string> | undefined => {
    if (path.includes(node)) {
      return [...path.slice(path.indexOf(node)), node]
    }

    if (done.has(node)) {
      return undefined
    }

    for (const next of graph[node] ?? []) {
      const cycle = visit(next, [...path, node])

      if (cycle !== undefined) {
        return cycle
      }
    }

    done.add(node)

    return undefined
  }

  for (const node of Object.keys(graph)) {
    const cycle = visit(node, [])

    if (cycle !== undefined) {
      return cycle
    }
  }

  return undefined
}

const undeclaredTargets = (graph: Graph, nodes: ReadonlyArray<string>) =>
  Object.values(graph)
    .flat()
    .filter(target => !nodes.includes(target))

const folders = (path: string) =>
  readdirSync(fileURLToPath(new URL(path, import.meta.url)), { withFileTypes: true })
    // lint-integration.test.ts writes temporary lint-probe-* modules while the suites run in parallel.
    .flatMap(entry =>
      entry.isDirectory() && !entry.name.startsWith('lint-probe-') ? [entry.name] : [],
    )
    .toSorted()

describe('findCycle', () => {
  test('reports a cycle through several nodes', () => {
    expect(findCycle({ a: ['b'], b: ['c'], c: ['a'] })).toEqual(['a', 'b', 'c', 'a'])
  })

  test('accepts a shared dependency reached by two paths', () => {
    expect(findCycle({ a: ['b', 'c'], b: ['c'], c: [] })).toBeUndefined()
  })
})

describe('workspace packages', () => {
  test('depend on each other without cycles', () => {
    expect(findCycle(packageDependencies)).toBeUndefined()
  })

  test('depend only on declared packages', () => {
    const packages = Object.keys(packageDependencies)

    expect(undeclaredTargets(packageDependencies, packages)).toEqual([])
    expect(undeclaredTargets(applicationDependencies, packages)).toEqual([])
  })
})

describe('API modules', () => {
  test('depend on each other without cycles', () => {
    expect(findCycle(apiModuleDependencies)).toBeUndefined()
  })

  test('are declared exactly as the module folders that exist', () => {
    expect(Object.keys(apiModuleDependencies).toSorted()).toEqual(
      folders('../../../../apps/api/src/modules'),
    )
  })

  test('depend only on declared modules', () => {
    expect(undeclaredTargets(apiModuleDependencies, Object.keys(apiModuleDependencies))).toEqual([])
  })
})
