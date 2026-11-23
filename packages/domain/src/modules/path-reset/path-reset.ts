import { Schema } from 'effect'

export const pathResetConfirmation = 'RESETUJ'

export const PathResetConfirmation = Schema.Literal(pathResetConfirmation)

export type PathResetConfirmation = typeof PathResetConfirmation.Type
