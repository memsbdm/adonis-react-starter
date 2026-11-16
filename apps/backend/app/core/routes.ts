import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const { core } = controllers

router.get('health', [core.HealthChecks, 'handle']).use(middleware.requireSecretToken())
