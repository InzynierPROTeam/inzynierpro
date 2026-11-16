import { AlchemyContext } from 'alchemy/AlchemyContext'
import { Layer } from 'effect'

// EXTERNAL: Alchemy beta.85 grants state bootstrap/upgrade with deploy --yes; disable state updates separately.
export const existingStateOnly = Layer.updateService(AlchemyContext, context => ({
  ...context,
  updateStateStore: false,
}))
