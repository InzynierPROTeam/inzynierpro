export const featureFileRoles = ['actions', 'validation', 'utils', 'types', 'config', 'stores']

export const featureFolderRoles = [
  ...featureFileRoles,
  'components',
  'hooks',
  'lib',
  'providers',
  'styles',
  'assets',
  'test',
]

export const platformFolderRoles = [
  'components',
  'hooks',
  'utils',
  'types',
  'lib',
  'config',
  'stores',
  'providers',
  'styles',
  'assets',
  'test',
  'features',
  'layout',
  'routes',
]

export const contractFileRoles = ['api', 'requests', 'responses', 'errors']
export const contractFolderRoles = ['requests', 'responses', 'errors', 'endpoints']
export const queryFileRoles = ['keys', 'queries']
export const queryFolderRoles = ['queries']

export const apiLayerRoles = {
  domain: {
    pattern: /^(?:[a-z0-9-]+\.(?:model|rules|event)|(?:[a-z0-9-]+\.)?errors)\.ts$/,
    description: '<concept>.model.ts, .rules.ts, .event.ts and [<topic>.]errors.ts',
  },
  application: {
    pattern:
      /^(?:[a-z0-9-]+\.(?:command|query|policy|reader|repository|service|job|event-handler)|(?:[a-z0-9-]+\.)?errors)\.ts$/,
    description:
      '<concept>.command.ts, .query.ts, .policy.ts, .reader.ts, .repository.ts, .service.ts, .job.ts, .event-handler.ts and [<topic>.]errors.ts',
  },
  infrastructure: {
    pattern:
      /^[a-z0-9-]+\.(?:reader|repository|service|client)\.(?:postgres|http|redis|file|auth)\.ts$/,
    description: '<concept>.<reader|repository|service|client>.<postgres|http|redis|file|auth>.ts',
  },
  http: {
    pattern: /^(?:[a-z0-9-]+\.)?(?:handlers|mappers|errors)\.ts$/,
    description: '[<topic>.]handlers.ts, [<topic>.]mappers.ts and [<topic>.]errors.ts',
  },
}
