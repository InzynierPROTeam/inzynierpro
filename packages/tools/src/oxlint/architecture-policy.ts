export const packageDependencies = {
  utils: ['config', 'domain'],
  config: [],
  domain: [],
  'browser-utils': ['utils'],
  'react-utils': ['browser-utils', 'utils'],
  ui: ['react-utils', 'browser-utils', 'utils'],
  'mobile-ui': ['react-utils', 'utils'],
  'api-contracts': ['domain', 'utils'],
  'api-client': ['api-contracts', 'utils'],
  queries: ['api-client', 'api-contracts', 'domain', 'utils'],
  db: ['utils'],
  redis: ['utils'],
  email: ['domain', 'config', 'utils', 'ui'],
  auth: ['db', 'redis', 'email', 'domain', 'config', 'utils'],
  'auth-client': ['utils'],
  testing: ['utils'],
  tools: [],
} as const

const clientDependencies = [
  'api-contracts',
  'api-client',
  'auth-client',
  'queries',
  'domain',
  'utils',
  'browser-utils',
  'react-utils',
  'config',
]

export const applicationDependencies = {
  // auth-client is used only by the API tests, which sign in as a client would.
  api: [
    'api-contracts',
    'auth',
    'auth-client',
    'email',
    'domain',
    'db',
    'redis',
    'utils',
    'config',
  ],
  platform: [...clientDependencies, 'ui'],
  // Browser tests drive the running applications: they sign in through the shared auth client and
  // type API requests with the contracts.
  e2e: ['api-contracts', 'auth-client'],
  admin: [...clientDependencies, 'ui'],
  web: [...clientDependencies, 'ui'],
  mobile: [...clientDependencies, 'mobile-ui'],
} as const

// List every API module; dependencies point from personal learning toward shared catalogue data.
export const apiModuleDependencies = {
  'background-jobs': [],
  'exam-calendar': [],
  health: [],
  identity: [],
  'learning-content': [],
  preparation: ['exam-calendar', 'qualification-paths'],
  'qualification-paths': [],
  study: ['preparation', 'learning-content'],
} as const satisfies Record<string, ReadonlyArray<string>>

export const universalPackages = [
  'utils',
  'config',
  'domain',
  'api-contracts',
  'api-client',
  'auth-client',
]

export const testFilePattern = '\\.(test|spec)\\.[cm]?[jt]sx?$'
