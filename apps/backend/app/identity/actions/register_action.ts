import { Result } from '@julr/tenace'
import { EmailAlreadyInUse } from '#identity/exceptions/email_already_in_use_exception'
import User from '#identity/models/user'

interface Params {
  fullName: string
  email: string
  password: string
}

export class Register {
  async handle(params: Params) {
    const { fullName, email, password } = params
    const user = await User.findBy('email', email)

    if (user) {
      return Result.err(new EmailAlreadyInUse())
    }

    try {
      return Result.ok(
        await User.create({
          fullName,
          email,
          password,
        }),
      )
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === '23505' &&
        'constraint' in error &&
        error.constraint === 'users_email_unique'
      ) {
        return Result.err(new EmailAlreadyInUse())
      }

      throw error
    }
  }
}
