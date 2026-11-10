import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

// The builds do not copy CSS, so the files are resolved through package exports. Resolving from
// import.meta.url also works in the preview server, which runs templates with their own file URL.
const require = createRequire(import.meta.url)

const readCss = (specifier: string) => readFileSync(require.resolve(specifier), 'utf8')

// The shared platform theme first, then the email overrides that replace its rem sizes.
export const themeCss = [readCss('@inzpro/ui/theme.css'), readCss('@inzpro/email/theme.css')].join(
  '\n',
)
