import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class IsAuthenticatedController {
  handle({ auth }: HttpContext) {
    return { isAuthenticated: !!auth.user }
  }
}
