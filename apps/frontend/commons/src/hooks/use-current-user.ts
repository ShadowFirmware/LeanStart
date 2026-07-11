"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import type { Role } from "../types";
import { DEMO_MODE, DEMO_USERS, type DemoUser } from "../lib/demo";

/**
 * Usuario autenticado actual. Prioriza la sesión real de next-auth; si no hay
 * sesión y el modo demo está activo, deriva una identidad demo determinista a
 * partir del primer segmento de la ruta (/emprendedor, /mentor, ...).
 * Devuelve null cuando no hay sesión y el modo demo está apagado.
 */
export function useCurrentUser(): DemoUser | null {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (session?.user?.id) {
    return {
      id: session.user.id,
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      rol: session.user.rol,
    };
  }

  if (DEMO_MODE) {
    const segmento = pathname.split("/")[1] as Role;
    return DEMO_USERS[segmento] ?? DEMO_USERS.emprendedor;
  }

  return null;
}
