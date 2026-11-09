export const packageDependencies = {
  utils: [],
  config: [],
  domain: ['utils'],
  'browser-utils': ['utils'],
  'react-utils': ['browser-utils', 'utils'],
  ui: ['react-utils', 'browser-utils', 'utils'],
  'mobile-ui': ['react-utils', 'utils'],
  'api-contracts': ['domain', 'utils'],
  'api-client': ['api-contracts', 'utils'],
  queries: ['api-client', 'api-contracts', 'domain', 'utils'],
  db: ['utils'],
  testing: ['utils'],
  tools: [],
} as const

const clientDependencies = [
  'api-contracts',
  'api-client',
  'queries',
  'domain',
  'utils',
  'browser-utils',
  'react-utils',
  'config',
]

export const applicationDependencies = {
  api: ['api-contracts', 'domain', 'db', 'utils', 'config'],
  platform: [...clientDependencies, 'ui'],
  admin: [...clientDependencies, 'ui'],
  web: [...clientDependencies, 'ui'],
  mobile: [...clientDependencies, 'mobile-ui'],
} as const

export const universalPackages = ['utils', 'config', 'domain', 'api-contracts', 'api-client']

export const testFilePattern = '\\.(test|spec)\\.[cm]?[jt]sx?$'
