"use client";

import { useSession } from "next-auth/react";
import type { Modulo, Accion } from "../types";

export function usePrivilegios() {
  const { data: session } = useSession();
  const privilegios = session?.user?.privilegios ?? [];

  function puede(modulo: Modulo, accion: Accion): boolean {
    return privilegios.some(
      (p) => p.modulo === modulo && p.acciones.includes(accion)
    );
  }

  return { puede, privilegios };
}
