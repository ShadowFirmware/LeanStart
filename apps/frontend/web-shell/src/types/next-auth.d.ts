import type { DefaultSession } from "next-auth";
import type { Role, Modulo, Accion } from "@leanstart/commons";

export interface Privilegio {
  modulo: Modulo;
  acciones: Accion[];
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** Rol principal = roles[0]. Se mantiene por compatibilidad; usar `roles` para acceso. */
      rol: Role;
      roles: Role[];
      privilegios: Privilegio[];
    } & DefaultSession["user"];
    /** JWT del api-gateway — para llamadas autenticadas desde el frontend al backend real.
     *  Ausente para las cuentas demo (ver DEMO_ACCOUNTS): no hay backend real emitiendo un JWT. */
    accessToken?: string;
  }

  interface User {
    id: string;
    rol: Role;
    roles: Role[];
    privilegios: Privilegio[];
    /** Ausente para las cuentas demo (ver DEMO_ACCOUNTS): no hay backend real emitiendo un JWT. */
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: Role;
    roles: Role[];
    privilegios: Privilegio[];
    /** Ausente para las cuentas demo (ver DEMO_ACCOUNTS): no hay backend real emitiendo un JWT. */
    accessToken?: string;
  }
}
