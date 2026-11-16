import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { email, password } from '#identity/validators/identity_validator'
import { withTransaction } from '#app/core/utils/transaction'
import { Register } from '#identity/actions/register_action'
import { Result } from '@julr/tenace'

@inject()
export default class RegisterController {
  static readonly validator = vine.create({
    fullName: vine.string().trim().minLength(1).maxLength(50),
    email: email(),
    password: password().confirmed({ as: 'passwordConfirmation' }),
    passwordConfirmation: vine.string(),
  })

  constructor(private readonly register: Register) {}

  async handle({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(RegisterController.validator)
    const res = await withTransaction(() => this.register.handle(payload))

    Result.match(res, {
      ok: async user => {
        await auth.use('web').login(user)
        return response.created()
      },
      EmailAlreadyInUse: error => {
        return response.conflict({ code: error.code })
      },
    })
  }
}
