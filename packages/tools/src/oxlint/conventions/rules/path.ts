export const normalizedPath = (filename: string) => filename.replaceAll('\\', '/')

export const pathSegments = (filename: string) => normalizedPath(filename).split('/')

export const baseName = (filename: string) =>
  (pathSegments(filename).at(-1) ?? '').replace(/\..*$/, '')

export const moduleSourcePath = (filename: string, workspace: string) => {
  const path = normalizedPath(filename)
  const marker = `/packages/${workspace}/src/modules/`
  const start = path.indexOf(marker)

  return start < 0 ? undefined : path.slice(start + marker.length)
}

export const isModuleSource = (filename: string, workspace: string) =>
  moduleSourcePath(filename, workspace) !== undefined &&
  !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(filename)
