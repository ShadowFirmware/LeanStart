"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useEmpresasStore, useObservacionesStore } from "@leanstart/empresas-front";
import { useNotificacionesStore } from "@leanstart/notificaciones-front";
import { modoDemo, useUsuariosStore, usePerfilStore } from "@leanstart/commons";
import {
  useCriteriosStore, useEvaluacionesStore, usePrivilegiosStore,
  useReportesGeneradosStore, useViabilidadStore,
} from "@leanstart/administrador-front";

/**
 * Sincronización en vivo entre pestañas/ventanas del mismo navegador + rehidratación inicial.
 *
 * Todos los stores de zustand persisten en localStorage con `skipHydration: true`,
 * de modo que servidor y primer render de cliente coinciden (sin mismatch de hidratación).
 * Aquí, tras montar, disparamos la rehidratación inicial una sola vez para toda la app.
 *
 * Además, cuando OTRA pestaña escribe (p. ej. el mentor deja un comentario), el navegador
 * dispara un evento `storage`; re-hidratamos el store correspondiente para reflejar el
 * cambio al instante, sin recargar — como un documento colaborativo.
 *
 * Limitación: funciona entre pestañas del MISMO navegador (no entre equipos distintos,
 * lo cual requeriría un backend/servidor de tiempo real).
 */
const STORES = [
  { key: "leanstart-empresas", store: useEmpresasStore },
  { key: "leanstart-observaciones", store: useObservacionesStore },
  { key: "leanstart-notificaciones", store: useNotificacionesStore },
  { key: "leanstart-usuarios", store: useUsuariosStore },
  { key: "leanstart-perfil", store: usePerfilStore },
  { key: "leanstart-evaluaciones", store: useEvaluacionesStore },
  { key: "leanstart-privilegios", store: usePrivilegiosStore },
  { key: "leanstart-reportes-generados", store: useReportesGeneradosStore },
] as const;

export function LiveSync() {
  const { data: session, status } = useSession();
  const rol = session?.user?.rol;
  const userId = session?.user?.id;

  // Rehidratación inicial (una vez, tras montar en el cliente).
  useEffect(() => {
    STORES.forEach(({ store }) => void store.persist?.rehydrate());
  }, []);

  // Backend real: carga inicial desde la API una vez que hay sesión.
  // (silencioso a propósito: la UI ya maneja el estado vacío / 403 si el rol no aplica.)
  useEffect(() => {
    if (modoDemo() || status !== "authenticated") return;

    useEmpresasStore.getState().cargarEmpresas().catch(() => {});
    useNotificacionesStore.getState().cargarNotificaciones().catch(() => {});
    if (userId) usePerfilStore.getState().cargarPerfil(userId).catch(() => {});

    if (rol === "administrador") {
      useUsuariosStore.getState().cargarUsuarios().catch(() => {});
    }
    if (rol === "administrador" || rol === "evaluador") {
      useCriteriosStore.getState().cargarCriterios().catch(() => {});
      useViabilidadStore.getState().cargarViabilidad().catch(() => {});
      useReportesGeneradosStore.getState().cargarReportesGenerados().catch(() => {});
    }
  }, [status, rol, userId]);

  // El backend no empuja notificaciones ni cambios de perfil en tiempo real: si otra
  // persona genera una notificación, o el usuario edita su perfil desde otro
  // dispositivo, esta pestaña solo se entera volviendo a pedirlos.
  useEffect(() => {
    if (modoDemo() || status !== "authenticated") return;
    const interval = setInterval(() => {
      useNotificacionesStore.getState().cargarNotificaciones().catch(() => {});
      if (userId) usePerfilStore.getState().cargarPerfil(userId).catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, [status, userId]);

  // Sincronización entre pestañas.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      // localStorage.clear() → key === null: re-hidratar todos.
      if (e.key === null) {
        STORES.forEach(({ store }) => void store.persist?.rehydrate());
        return;
      }
      const match = STORES.find(({ key }) => key === e.key);
      if (match) void match.store.persist?.rehydrate();
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
