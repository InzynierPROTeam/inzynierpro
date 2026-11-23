import { pathResetConfirmation } from '@inzpro/domain/modules/path-reset/path-reset'
import { profileNameMaxLength } from '@inzpro/domain/modules/profiles/profile'
import { Schema } from 'effect'

export const profileNameFormSchema = Schema.Struct({
  name: Schema.String.check(
    Schema.makeFilter(name => name.trim().length > 0, { message: 'Wpisz nazwę profilu.' }),
    Schema.makeFilter(name => name.trim().length <= profileNameMaxLength, {
      message: `Nazwa może mieć maksymalnie ${profileNameMaxLength} znaków.`,
    }),
  ),
})

export const resetPathFormSchema = Schema.Struct({
  confirmation: Schema.String.check(
    Schema.makeFilter(confirmation => confirmation.trim() === pathResetConfirmation, {
      message: `Wpisz ${pathResetConfirmation}, aby potwierdzić.`,
    }),
  ),
})
