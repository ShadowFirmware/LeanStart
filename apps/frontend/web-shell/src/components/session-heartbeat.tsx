"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiFetch, modoDemo } from "@leanstart/commons";

const INTERVALO_MS = 8000;

/**
 * Avisa al gateway cada pocos segundos que esta sesión sigue activa
 * (`SessionPresenceService` en el backend). Mientras al menos una pestaña siga
 * mandando esto, el token se acepta; si se cierran TODAS las pestañas/el
 * navegador, deja de renovarse y el token deja de servir a los ~30s — sin que
 * cerrar una sola pestaña (con otra abierta) o recargar la página corten la
 * sesión de golpe.
 */
export function SessionHeartbeat() {
  const { status } = useSession();

  useEffect(() => {
    if (modoDemo() || status !== "authenticated") return;

    function enviar() {
      apiFetch("/auth/heartbeat", { method: "POST" }).catch(() => {});
    }

    enviar();
    const interval = setInterval(enviar, INTERVALO_MS);
    return () => clearInterval(interval);
  }, [status]);

  return null;
}
