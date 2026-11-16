import { Exception } from '@adonisjs/core/exceptions'

export class EmailAlreadyInUse extends Exception {
  static code = 'E_EMAIL_ALREADY_IN_USE'
  readonly _tag = 'EmailAlreadyInUse' as const
}
