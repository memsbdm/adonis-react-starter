import { Exception } from '@adonisjs/core/exceptions'

export class InvalidCredentials extends Exception {
  static code = 'E_INVALID_CREDENTIALS'
  readonly _tag = 'InvalidCredentials' as const
}
