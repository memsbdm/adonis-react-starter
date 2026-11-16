import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class LogoutController {
  handle({ auth }: HttpContext) {
    return auth.use('web').logout()
  }
}
