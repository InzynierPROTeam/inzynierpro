import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { Schema } from 'effect'

const Metric = Schema.Struct({ pct: Schema.Union([Schema.Finite, Schema.Literal('Unknown')]) })

const Summary = Schema.Struct({
  total: Schema.Struct({ lines: Metric, statements: Metric, functions: Metric, branches: Metric }),
})

const decodeSummary = Schema.decodeUnknownSync(Schema.fromJsonString(Summary))

const percent = ({ pct }: typeof Metric.Type) => (pct === 'Unknown' ? '–' : `${pct.toFixed(1)}%`)

const rows = ['apps', 'packages'].flatMap(group =>
  readdirSync(group).flatMap(name => {
    const report = join(group, name, 'coverage', 'coverage-summary.json')

    if (!existsSync(report)) {
      return []
    }

    const { total } = decodeSummary(readFileSync(report, 'utf8'))

    return [
      `| ${group}/${name} | ${percent(total.lines)} | ${percent(total.statements)} | ${percent(total.functions)} | ${percent(total.branches)} |`,
    ]
  }),
)

console.log(
  [
    '## Test coverage',
    '',
    'Informational only; no threshold blocks a change.',
    '',
    '| Workspace | Lines | Statements | Functions | Branches |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n'),
)
