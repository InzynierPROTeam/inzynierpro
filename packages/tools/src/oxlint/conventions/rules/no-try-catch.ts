import { defineRule } from '@oxlint/plugins'

export const noTryCatchRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Handle failures with Effect instead of try/catch.',
    },
    schema: [],
    messages: {
      tryCatch:
        'Wrap the call with Effect.try or Effect.tryPromise and handle typed failures with Effect.catchTag, Effect.catchIf or Effect.option.',
    },
  },
  create(context) {
    return {
      CatchClause(node) {
        context.report({ node, messageId: 'tryCatch' })
      },
    }
  },
})
