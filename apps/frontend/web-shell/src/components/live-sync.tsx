"use client";

import { useEffect, useLayoutEffect } from "react";
import { useSession } from "next-auth/react";
import { useEmpresasStore, useObservacionesStore } from "@leanstart/empresas-front";
import { useNotificacionesStore } from "@leanstart/notificaciones-front";
import { modoDemo, useUsuariosStore, usePerfilStore } from "@leanstart/commons";
import {
  useCriteriosStore, useEvaluacionesStore, usePrivilegiosStore,
  useReportesGeneradosStore, useViabilidadStore, useRolesStore,
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
  { key: "leanstart-criterios", store: useCriteriosStore },
  { key: "leanstart-roles", store: useRolesStore },
  { key: "leanstart-viabilidad", store: useViabilidadStore },
] as const;

/**
 * En el navegador la rehidratación inicial corre en un layout effect, que se
 * ejecuta tras el commit pero ANTES de pintar: así las vistas nunca alcanzan a
 * mostrarse con los stores vacíos (el "empresa no encontrada" fugaz). En el
 * render del servidor no hay layout effects, de ahí el intercambio.
 */
const useEfectoDePintado = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function LiveSync() {
  const { data: session, status } = useSession();
  const roles = session?.user?.roles;
  const userId = session?.user?.id;

  // Rehidratación inicial (una vez, tras montar en el cliente).
  useEfectoDePintado(() => {
    STORES.forEach(({ store }) => void store.persist?.rehydrate());
  }, []);

  // Backend real: carga inicial desde la API una vez que hay sesión.
  // (silencioso a propósito: la UI ya maneja el estado vacío / 403 si el rol no aplica.)
  useEffect(() => {
    if (modoDemo() || status !== "authenticated") return;

    useEmpresasStore.getState().cargarEmpresas().catch(() => {});
    useNotificacionesStore.getState().cargarNotificaciones().catch(() => {});
    if (userId) usePerfilStore.getState().cargarPerfil(userId).catch(() => {});

    if (roles?.includes("administrador")) {
      useUsuariosStore.getState().cargarUsuarios().catch(() => {});
    }
    if (roles?.includes("administrador") || roles?.includes("evaluador")) {
      useCriteriosStore.getState().cargarCriterios().catch(() => {});
      useReportesGeneradosStore.getState().cargarReportesGenerados().catch(() => {});
    }
    // Todos los roles pueden leer la config de viabilidad (para mostrar el nivel
    // obtenido en las cards de empresas); solo el administrador puede modificarla.
    useViabilidadStore.getState().cargarViabilidad().catch(() => {});
  }, [status, roles, userId]);

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
