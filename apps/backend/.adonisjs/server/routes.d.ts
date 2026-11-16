import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health_checks': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'health_checks': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'health_checks': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}