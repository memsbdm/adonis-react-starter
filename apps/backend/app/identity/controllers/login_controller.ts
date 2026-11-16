import { inject } from '@adonisjs/core'
import { Login } from '#identity/actions/login_action'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { email } from '#identity/validators/identity_validator'
import { withTransaction } from '#core/utils/transaction'

@inject()
export default class LoginController {
  static readonly validator = vine.create({
    email: email(),
    password: vine.string(),
  })

  constructor(private readonly login: Login) {}

  async handle({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(LoginController.validator)
    const res = await withTransaction(() => this.login.handle(payload))

    if (!res.ok) {
      return response.unauthorized({ code: res.error.code })
    }

    await auth.use('web').login(res.value)
  }
}
