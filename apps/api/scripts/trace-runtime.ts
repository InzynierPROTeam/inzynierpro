import { copyFile, lstat, mkdir, readdir, readlink, realpath, symlink } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'

import { nodeFileTrace } from '@vercel/nft'

const [root, out] = process.argv.slice(2).map(path => resolve(path))

if (root === undefined || out === undefined) {
  throw new Error('Usage: trace-runtime.ts <workspace root> <output directory>')
}

const dist = join(root, 'apps/api/dist')

// The migrator loads migrations by reading the directory, so tracing cannot find them.
const migrations = (await readdir(join(dist, 'migrations')))
  .filter(file => file.endsWith('.js'))
  .map(file => join(dist, 'migrations', file))

const { fileList } = await nodeFileTrace(
  [
    join(dist, 'main.js'),
    join(dist, 'lib/migrate.js'),
    join(dist, 'worker/main.js'),
    join(dist, 'worker/status.js'),
    ...migrations,
  ],
  { base: root },
)

const files = new Set(fileList)

const addPackageFile = async (fromPackage: string, specifier: string) => {
  const file = createRequire(join(fromPackage, 'package.json')).resolve(specifier)
  const name = specifier.split('/').slice(0, 2).join('/')
  const link = join(fromPackage, 'node_modules', name)

  const linked = await lstat(link).then(
    stats => stats.isSymbolicLink(),
    () => false,
  )

  const packageRoot = linked ? await realpath(link) : fromPackage

  files.add(relative(root, file))
  files.add(relative(root, join(packageRoot, 'package.json')))

  if (linked) {
    files.add(relative(root, link))
  }
}

// The email theme reads its CSS through package exports, which tracing does not follow.
const email = join(root, 'packages/email')

await addPackageFile(email, '@inzpro/ui/theme.css')

await addPackageFile(email, '@inzpro/email/theme.css')

for (const file of files) {
  const source = join(root, file)
  const target = join(out, file)
  const stats = await lstat(source)

  if (stats.isDirectory()) {
    continue
  }

  await mkdir(dirname(target), { recursive: true })

  if (stats.isSymbolicLink()) {
    await symlink(await readlink(source), target)
  } else {
    await copyFile(source, target)
  }
}

console.log(`Copied ${files.size} runtime files to ${out}`)
