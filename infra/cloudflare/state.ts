import { AlchemyContext } from 'alchemy/AlchemyContext'
import { Layer } from 'effect'

// Alchemy beta.85 maps deploy --yes to state lifecycle approval as well.
// Application deployment approval must never grant state bootstrap/upgrade.
export const existingStateOnly = Layer.updateService(AlchemyContext, context => ({
  ...context,
  updateStateStore: false,
}))
