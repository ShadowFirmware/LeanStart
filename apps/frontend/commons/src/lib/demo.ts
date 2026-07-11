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
