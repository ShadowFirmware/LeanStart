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
      rol: Role;
      privilegios: Privilegio[];
    } & DefaultSession["user"];
    /** JWT del api-gateway — para llamadas autenticadas desde el frontend al backend real. */
    accessToken: string;
  }

  interface User {
    id: string;
    rol: Role;
    privilegios: Privilegio[];
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: Role;
    privilegios: Privilegio[];
    accessToken: string;
  }
}
