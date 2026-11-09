// Lint rules see absolute, platform-specific paths; rules match on forward-slash paths.
export const normalizedPath = (filename: string) => filename.replaceAll('\\', '/')

export const pathSegments = (filename: string) => normalizedPath(filename).split('/')

export const baseName = (filename: string) =>
  (pathSegments(filename).at(-1) ?? '').replace(/\..*$/, '')
