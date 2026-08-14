import type { Privilegio, Role } from "./roles";

/**
 * Identidad ya validada por el api-gateway y propagada a los microservicios
 * internos vía headers de confianza (ver GatewayKeyGuard). Los servicios
 * internos NUNCA vuelven a validar el JWT: confían en la red interna +
 * la llave compartida `x-internal-key`.
 */
export interface AuthUser {
  id: string;
  /** Rol principal = roles[0]. Se mantiene por compatibilidad; usar `roles` para autorización. */
  rol: Role;
  /** Todos los roles del usuario — un usuario puede tener varios a la vez. Nunca vacío. */
  roles: Role[];
  privilegios: Privilegio[];
}

export const INTERNAL_KEY_HEADER = "x-internal-key";
export const USER_ID_HEADER = "x-user-id";
export const USER_ROL_HEADER = "x-user-rol";
export const USER_ROLES_HEADER = "x-user-roles";
export const USER_PRIVILEGIOS_HEADER = "x-user-privilegios";
