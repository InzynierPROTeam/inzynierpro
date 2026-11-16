import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

// The builds do not copy CSS, so the files are resolved through package exports. Resolving from
// import.meta.url also works in the preview server, which runs templates with their own file URL.
const require = createRequire(import.meta.url)

const readCss = (specifier: string) => readFileSync(require.resolve(specifier), 'utf8')

export const themeCss = [readCss('@inzpro/ui/theme.css'), readCss('@inzpro/email/theme.css')].join(
  '\n',
)
