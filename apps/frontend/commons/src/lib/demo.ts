import type { Role } from "../types";

/**
 * Modo demo (solo-front, sin backend). Cuando está activo se permite el acceso
 * sin login real y se usan identidades demo fijas por rol. Se activa con
 * `NEXT_PUBLIC_DEMO_MODE=true`. NUNCA debe estar activo en un despliegue real.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  rol: Role;
}

/** Usuario demo determinista por rol. El `id` sirve para el scoping por dueño. */
export const DEMO_USERS: Record<Role, DemoUser> = {
  emprendedor: {
    id: "demo-emprendedor",
    name: "Emprendedor Demo",
    email: "demo@leanstart.dev",
    rol: "emprendedor",
  },
  mentor: {
    id: "demo-mentor",
    name: "Mentor Demo",
    email: "mentor@leanstart.dev",
    rol: "mentor",
  },
  evaluador: {
    id: "demo-evaluador",
    name: "Evaluador Demo",
    email: "evaluador@leanstart.dev",
    rol: "evaluador",
  },
  administrador: {
    id: "demo-admin",
    name: "Admin Demo",
    email: "admin@leanstart.dev",
    rol: "administrador",
  },
};

export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  /** Rol principal = roles[0]. Se mantiene por compatibilidad. */
  rol: Role;
  /** Todos los roles de la cuenta — si tiene varios, ve las secciones de cada uno a la vez. */
  roles?: Role[];
}

/**
 * Cuentas demo con credenciales reales, para poder probar el login (correo +
 * contraseña) con el Credentials provider de next-auth sin backend. Solo se
 * usan si `DEMO_MODE` está activo (ver auth.ts en web-shell).
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "demo-daniel",
    name: "Daniel",
    email: "daniel@example.com",
    password: "12345678",
    rol: "emprendedor",
    // Multi-rol de prueba: con esto se puede verificar el sidebar combinado
    // (secciones de emprendedor y mentor a la vez) sin necesitar el backend real.
    roles: ["emprendedor", "mentor"],
  },
];
