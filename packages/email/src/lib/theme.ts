import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const readCss = (specifier: string) => readFileSync(require.resolve(specifier), 'utf8')

export const themeCss = [readCss('@inzpro/ui/theme.css'), readCss('@inzpro/email/theme.css')].join(
  '\n',
)
