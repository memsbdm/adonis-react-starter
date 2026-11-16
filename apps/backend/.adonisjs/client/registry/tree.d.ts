/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  healthChecks: typeof routes['health_checks']
  isAuthenticated: typeof routes['is_authenticated']
  login: typeof routes['login']
  register: typeof routes['register']
  getMe: typeof routes['get_me']
  logout: typeof routes['logout']
}
