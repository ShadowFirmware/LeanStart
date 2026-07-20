"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { cerrarSesionBackend, modoDemo } from "@leanstart/commons";

const LIMITE_INACTIVIDAD_MS = 5 * 60 * 1000;
const EVENTOS_ACTIVIDAD = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

/**
 * Cierra la sesión automáticamente tras 5 minutos sin interacción del usuario,
 * para no dejar una sesión autenticada abierta indefinidamente en un equipo
 * compartido o abandonado. El JWT en sí no expira por inactividad, solo por
 * su duración absoluta, así que esto se resuelve del lado del cliente.
 */
export function InactivityLogout() {
  const { status } = useSession();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (modoDemo() || status !== "authenticated") return;

    function cerrarPorInactividad() {
      cerrarSesionBackend().finally(() => signOut({ callbackUrl: "/login" }));
    }

    function reiniciarTemporizador() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(cerrarPorInactividad, LIMITE_INACTIVIDAD_MS);
    }

    reiniciarTemporizador();
    EVENTOS_ACTIVIDAD.forEach((evento) => window.addEventListener(evento, reiniciarTemporizador));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      EVENTOS_ACTIVIDAD.forEach((evento) => window.removeEventListener(evento, reiniciarTemporizador));
    };
  }, [status]);

  return null;
}
