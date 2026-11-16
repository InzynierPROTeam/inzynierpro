export const normalizedPath = (filename: string) => filename.replaceAll('\\', '/')

export const pathSegments = (filename: string) => normalizedPath(filename).split('/')

export const baseName = (filename: string) =>
  (pathSegments(filename).at(-1) ?? '').replace(/\..*$/, '')
