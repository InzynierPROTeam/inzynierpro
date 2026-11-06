import { definePlugin, defineRule } from '@oxlint/plugins'
import type { Context, ESTree } from '@oxlint/plugins'

type Locatable = {
  loc: {
    start: {
      line: number
    }
    end: {
      line: number
    }
  }
}

type RangedLocatable = Locatable & {
  range: [number, number]
}

type Statement = ESTree.Statement & {
  parent?: unknown
}

type StatementContainer =
  | (ESTree.Program & {
      parent?: unknown
    })
  | (ESTree.BlockStatement & {
      parent?: unknown
    })
  | (ESTree.SwitchCase & {
      parent?: unknown
    })

const CONTROL_STATEMENT_TYPES = new Set<Statement['type']>([
  'IfStatement',
  'SwitchStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'TryStatement',
])

function isControlStatement(node: Statement | null | undefined): boolean {
  return node !== null && node !== undefined && CONTROL_STATEMENT_TYPES.has(node.type)
}

function isStatementContainer<T>(node: T): node is T & StatementContainer {
  if (node === null || Object(node) !== node) {
    return false
  }

  // SAFETY: The surrounding validation or API contract guarantees this asserted type.
  const type = (node as { type?: unknown }).type

  return type === 'Program' || type === 'BlockStatement' || type === 'SwitchCase'
}

function getStatementList(parent: StatementContainer): Statement[] {
  switch (parent.type) {
    case 'Program':
    case 'BlockStatement':
      // SAFETY: The surrounding validation or API contract guarantees this asserted type.
      return parent.body as Statement[]

    case 'SwitchCase':
      // SAFETY: The surrounding validation or API contract guarantees this asserted type.
      return parent.consequent as Statement[]
  }
}

function lineGap(previous: Locatable, next: Locatable): number {
  return next.loc.start.line - previous.loc.end.line
}

function hasBlankLine(previous: Locatable, next: Locatable): boolean {
  return lineGap(previous, next) >= 2
}

function previousSibling(node: Statement): Statement | null {
  if (!isStatementContainer(node.parent)) {
    return null
  }

  const statements = getStatementList(node.parent)
  const index = statements.indexOf(node)

  if (index <= 0) {
    return null
  }

  return statements[index - 1] ?? null
}

function nextSibling(node: Statement): Statement | null {
  if (!isStatementContainer(node.parent)) {
    return null
  }

  const statements = getStatementList(node.parent)
  const index = statements.indexOf(node)

  if (index < 0 || index >= statements.length - 1) {
    return null
  }

  return statements[index + 1] ?? null
}

function getLeadingCommentAnchor(
  context: Context,
  node: Statement,
): ESTree.Node | ESTree.Token | ESTree.Comment {
  const comments = context.sourceCode.getCommentsBefore(node)

  if (comments.length === 0) {
    return node
  }

  let anchor: ESTree.Node | ESTree.Token | ESTree.Comment = node

  for (let index = comments.length - 1; index >= 0; index -= 1) {
    const comment = comments[index]

    if (comment === undefined) {
      continue
    }

    if (lineGap(comment, anchor) > 1) {
      break
    }

    anchor = comment
  }

  return anchor
}

function insertBlankLineBefore(context: Context, node: Statement, messageId: string): void {
  const anchor = getLeadingCommentAnchor(context, node)

  const previousTokenOrComment = context.sourceCode.getTokenBefore(anchor, {
    includeComments: true,
  })

  if (previousTokenOrComment === null) {
    return
  }

  if (hasBlankLine(previousTokenOrComment, anchor)) {
    return
  }

  context.report({
    node,
    messageId,

    fix(fixer) {
      // SAFETY: The surrounding validation or API contract guarantees this asserted type.
      return fixer.insertTextAfter(previousTokenOrComment as RangedLocatable, '\n')
    },
  })
}

function insertBlankLineAfter(
  context: Context,
  node: Statement,
  next: Statement,
  messageId: string,
): void {
  const anchor = getLeadingCommentAnchor(context, next)

  if (hasBlankLine(node, anchor)) {
    return
  }

  context.report({
    node,
    messageId,

    fix(fixer) {
      return fixer.insertTextAfter(node, '\n')
    },
  })
}

const blankLineBeforeReturn = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [],

    messages: {
      missing: 'Expected a blank line before this return statement.',
    },
  },

  create(context) {
    return {
      ReturnStatement(node: ESTree.ReturnStatement) {
        // SAFETY: The surrounding validation or API contract guarantees this asserted type.
        const statement = node as Statement
        const previous = previousSibling(statement)

        if (previous === null) {
          return
        }

        insertBlankLineBefore(context, statement, 'missing')
      },
    }
  },
})

const blankLinesAroundControlFlow = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [],

    messages: {
      before: 'Expected a blank line before this control-flow block.',
      after: 'Expected a blank line after this control-flow block.',
    },
  },

  create(context) {
    function check(node: Statement): void {
      const previous = previousSibling(node)
      const next = nextSibling(node)

      if (previous !== null && !isControlStatement(previous)) {
        insertBlankLineBefore(context, node, 'before')
      }

      if (next !== null && !isControlStatement(next)) {
        insertBlankLineAfter(context, node, next, 'after')
      }
    }

    return {
      IfStatement(node: ESTree.IfStatement) {
        // SAFETY: The surrounding validation or API contract guarantees this asserted type.
        check(node as Statement)
      },

      SwitchStatement(node: ESTree.SwitchStatement) {
        // SAFETY: The surrounding validation or API contract guarantees this asserted type.
        check(node as Statement)
      },

      ForStatement(node: ESTree.ForStatement) {
        // SAFETY: The surrounding validation or API contract guarantees this asserted type.
        check(node as Statement)
      },

      ForInStatement(node: ESTree.ForInStatement) {
        // SAFETY: The surrounding validation or API contract guarantees this asserted type.
        check(node as Statement)
      },

      ForOfStatement(node: ESTree.ForOfStatement) {
        // SAFETY: The surrounding validation or API contract guarantees this asserted type.
        check(node as Statement)
      },

      WhileStatement(node: ESTree.WhileStatement) {
        // SAFETY: The surrounding validation or API contract guarantees this asserted type.
        check(node as Statement)
      },

      DoWhileStatement(node: ESTree.DoWhileStatement) {
        // SAFETY: The surrounding validation or API contract guarantees this asserted type.
        check(node as Statement)
      },

      TryStatement(node: ESTree.TryStatement) {
        // SAFETY: The surrounding validation or API contract guarantees this asserted type.
        check(node as Statement)
      },
    }
  },
})

const importsFirst = defineRule({
  meta: {
    type: 'suggestion',
    schema: [],

    messages: {
      misplaced: 'Imports must form one contiguous block at the beginning of the file.',
    },
  },

  create(context) {
    return {
      Program(program: ESTree.Program) {
        let foundNonImportStatement = false

        for (const statement of program.body) {
          if (statement.type === 'ImportDeclaration') {
            if (foundNonImportStatement) {
              context.report({
                node: statement,
                messageId: 'misplaced',
              })
            }

            continue
          }

          if (statement.type === 'ExpressionStatement') {
            // SAFETY: The surrounding validation or API contract guarantees this asserted type.
            const expressionStatement = statement as ESTree.ExpressionStatement & {
              directive?: string
            }

            if (expressionStatement.directive !== undefined && !foundNonImportStatement) {
              continue
            }
          }

          foundNonImportStatement = true
        }
      },
    }
  },
})

const blankLineAfterImports = defineRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [],

    messages: {
      missing: 'Expected a blank line after the import block.',
    },
  },

  create(context) {
    return {
      Program(program: ESTree.Program) {
        const body = program.body

        if (body.length < 2) {
          return
        }

        let firstImportIndex = 0

        while (firstImportIndex < body.length) {
          const statement = body[firstImportIndex]

          if (statement?.type !== 'ExpressionStatement') {
            break
          }

          // SAFETY: The surrounding validation or API contract guarantees this asserted type.
          const expressionStatement = statement as ESTree.ExpressionStatement & {
            directive?: string
          }

          if (expressionStatement.directive === undefined) {
            break
          }

          firstImportIndex += 1
        }

        if (body[firstImportIndex]?.type !== 'ImportDeclaration') {
          return
        }

        let lastImportIndex = firstImportIndex

        while (body[lastImportIndex + 1]?.type === 'ImportDeclaration') {
          lastImportIndex += 1
        }

        const lastImport = body[lastImportIndex]
        const nextStatement = body[lastImportIndex + 1]

        if (lastImport === undefined || nextStatement === undefined) {
          return
        }

        const anchor = getLeadingCommentAnchor(context, nextStatement)

        if (hasBlankLine(lastImport, anchor)) {
          return
        }

        context.report({
          node: lastImport,
          messageId: 'missing',

          fix(fixer) {
            return fixer.insertTextAfter(lastImport, '\n')
          },
        })
      },
    }
  },
})

export default definePlugin({
  meta: {
    name: 'oxlint-plugin-project-layout',
  },

  rules: {
    'blank-line-before-return': blankLineBeforeReturn,
    'blank-lines-around-control-flow': blankLinesAroundControlFlow,
    'imports-first': importsFirst,
    'blank-line-after-imports': blankLineAfterImports,
  },
})
