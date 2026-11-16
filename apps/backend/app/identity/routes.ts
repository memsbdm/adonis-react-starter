import { defineRouteGroup } from '#app/core/utils/index'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const { identity } = controllers

router.get('is-authenticated', [identity.IsAuthenticated, 'handle'])

defineRouteGroup(() => {
  router.post('login', [identity.Login, 'handle'])
  router.post('register', [identity.Register, 'handle'])
}).use(middleware.guest())

defineRouteGroup(() => {
  router.get('me', [identity.GetMe, 'handle'])
  router.post('logout', [identity.Logout, 'handle'])
}).use(middleware.auth())
