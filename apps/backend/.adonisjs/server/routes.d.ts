import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health_checks': { paramsTuple?: []; params?: {} }
    'is_authenticated': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'register': { paramsTuple?: []; params?: {} }
    'get_me': { paramsTuple?: []; params?: {} }
    'logout': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'health_checks': { paramsTuple?: []; params?: {} }
    'is_authenticated': { paramsTuple?: []; params?: {} }
    'get_me': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'health_checks': { paramsTuple?: []; params?: {} }
    'is_authenticated': { paramsTuple?: []; params?: {} }
    'get_me': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'login': { paramsTuple?: []; params?: {} }
    'register': { paramsTuple?: []; params?: {} }
    'logout': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}