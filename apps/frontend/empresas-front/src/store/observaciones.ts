import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, modoDemo } from "@leanstart/commons";
import type { EstadoEmpresa, EstadoObservacion } from "@leanstart/commons";

/**
 * Colaboración en vivo entre mentor y emprendedor, con una excepción: los comentarios
 * nuevos del MENTOR quedan como "borrador" (invisibles para el emprendedor) hasta que el
 * mentor llama a `enviarRetroalimentacion` — así puede dejar varios comentarios sueltos
 * en distintos bloques/productos y mandarlos juntos, en vez de que cada uno aparezca
 * a medio escribir. Las respuestas del emprendedor (marcar "en revisión"/atendida) sí
 * siguen siendo instantáneas. La sincronización entre pestañas mantiene todo actualizado.
 */
export function puedeVerObservaciones(
  estado: EstadoEmpresa,
  _readOnly: boolean,
  _permitirComentarios: boolean
): boolean {
  // Una vez que el proyecto llega a un estado final (evaluado y publicado, o devuelto),
  // la retroalimentación del mentor ya cumplió su propósito — se oculta para todos.
  return estado !== "publicado" && estado !== "devuelto";
}

/** Estados en los que el proyecto está en manos del mentor para colaborar en vivo. */
const ESTADOS_MENTORIA: EstadoEmpresa[] = [
  "en_mentoria",
  "observaciones_pendientes",
  "observaciones_atendidas",
];

/** El mentor puede comentar mientras el proyecto está en cualquier etapa de la mentoría. */
export function mentorPuedeComentarEnEstado(estado: EstadoEmpresa): boolean {
  return ESTADOS_MENTORIA.includes(estado);
}

/**
 * Estados en los que el emprendedor puede editar/agregar en su proyecto. Bloqueado en
 * "en_mentoria" (el mentor todavía está escribiendo su retroalimentación, sin enviarla
 * — no hay nada concreto que corregir todavía) y en cuanto se manda a evaluación o se
 * publica. Sigue editable en "observaciones_pendientes"/"observaciones_atendidas": es
 * justo el turno del emprendedor para corregir lo que el mentor ya le señaló.
 */
export function emprendedorPuedeEditar(estado: EstadoEmpresa): boolean {
  return (
    estado === "borrador" ||
    estado === "devuelto" ||
    estado === "observaciones_pendientes" ||
    estado === "observaciones_atendidas"
  );
}

/** A qué tipo de elemento de la empresa está vinculada la observación.
 *  "general" = comentario único del mentor sobre la información principal del proyecto
 *  (nombre, foto, descripción y mercado objetivo); su elementoId es el id de la empresa. */
export type TipoElementoObservacion = "canvas" | "producto" | "hipotesis" | "general";

export interface Observacion {
  id: string;
  empresaId: string;
  tipoElemento: TipoElementoObservacion;
  /** Clave del bloque de canvas, o id del producto/hipótesis. */
  elementoId: string;
  autorNombre: string;
  comentario: string;
  estado: EstadoObservacion;
  creadaEn: string;
}

interface ObservacionesStore {
  observaciones: Observacion[];
  /** Trae las observaciones reales de una empresa (no-op en modo demo). */
  cargarObservaciones: (empresaId: string) => Promise<void>;
  agregarObservacion: (data: {
    empresaId: string;
    tipoElemento: TipoElementoObservacion;
    elementoId: string;
    autorNombre: string;
    comentario: string;
  }) => Promise<void>;
  actualizarEstadoObservacion: (id: string, estado: EstadoObservacion) => Promise<void>;
  eliminarObservacion: (id: string) => Promise<void>;
  cerrarObservacionesDeEmpresa: (empresaId: string) => Promise<void>;
  /**
   * El mentor envía todos sus borradores de esta empresa: recién ahí se hacen visibles
   * al emprendedor. Devuelve el estado real de la empresa después del envío (puede
   * haber cambiado a "observaciones_pendientes") para que quien lo llama pueda
   * sincronizar el store de empresas — si no, el botón "Enviar comentarios" se queda
   * visible con el estado viejo en memoria y se puede volver a apretar (envío doble).
   */
  enviarRetroalimentacion: (empresaId: string) => Promise<EstadoEmpresa | undefined>;
  /**
   * El emprendedor confirma que ya corrigió: marca todas sus observaciones abiertas
   * como "en_revision" (a la espera de que el mentor las confirme una por una, con el
   * botón "Confirmar resuelto" de cada observación — a propósito no hay un botón global,
   * para que el mentor realmente revise cada corrección), avanza el estado del proyecto
   * y notifica al mentor UNA vez. Devuelve el nuevo estado para que quien lo llama
   * sincronice el store de empresas.
   */
  marcarTodasAtendidas: (empresaId: string) => Promise<EstadoEmpresa | undefined>;
}

function mapObservacion(o: Record<string, unknown>): Observacion {
  return {
    id: o.id as string,
    empresaId: o.empresaId as string,
    tipoElemento: o.tipoElemento as TipoElementoObservacion,
    elementoId: o.elementoId as string,
    autorNombre: o.autorNombre as string,
    comentario: o.comentario as string,
    estado: o.estado as EstadoObservacion,
    creadaEn: new Date(o.createdAt as string).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

export const useObservacionesStore = create<ObservacionesStore>()(
  persist(
    (set, get) => ({
      observaciones: [],

      async cargarObservaciones(empresaId) {
        if (modoDemo()) return;
        const observaciones = await apiFetch<Record<string, unknown>[]>(`/empresas/${empresaId}/observaciones`);
        set((state) => ({
          observaciones: [
            ...state.observaciones.filter((o) => o.empresaId !== empresaId),
            ...observaciones.map(mapObservacion),
          ],
        }));
      },

      async agregarObservacion(data) {
        if (!modoDemo()) {
          const creada = await apiFetch<Record<string, unknown>>(`/empresas/${data.empresaId}/observaciones`, {
            method: "POST",
            body: JSON.stringify(data),
          });
          set({ observaciones: [mapObservacion(creada), ...get().observaciones] });
          return;
        }

        const id = crypto.randomUUID();
        const ahora = new Date().toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const nueva: Observacion = { id, ...data, estado: "pendiente", creadaEn: ahora };
        set({ observaciones: [nueva, ...get().observaciones] });
      },

      async actualizarEstadoObservacion(id, estado) {
        if (!modoDemo()) {
          const empresaId = get().observaciones.find((o) => o.id === id)?.empresaId;
          if (!empresaId) return;
          const actualizada = await apiFetch<Record<string, unknown>>(
            `/empresas/${empresaId}/observaciones/${id}/estado`,
            { method: "PATCH", body: JSON.stringify({ estado }) }
          );
          set({ observaciones: get().observaciones.map((o) => (o.id === id ? mapObservacion(actualizada) : o)) });
          return;
        }

        set({
          observaciones: get().observaciones.map((o) => (o.id === id ? { ...o, estado } : o)),
        });
      },

      async eliminarObservacion(id) {
        if (!modoDemo()) {
          const empresaId = get().observaciones.find((o) => o.id === id)?.empresaId;
          if (empresaId) await apiFetch(`/empresas/${empresaId}/observaciones/${id}`, { method: "DELETE" });
        }
        set({ observaciones: get().observaciones.filter((o) => o.id !== id) });
      },

      async enviarRetroalimentacion(empresaId) {
        if (modoDemo()) return undefined;
        const resultado = await apiFetch<{ estado: EstadoEmpresa }>(`/empresas/${empresaId}/observaciones/enviar`, { method: "POST" });
        set({
          observaciones: get().observaciones.map((o) =>
            o.empresaId === empresaId && o.estado === "borrador" ? { ...o, estado: "pendiente" } : o
          ),
        });
        return resultado.estado;
      },

      async marcarTodasAtendidas(empresaId) {
        if (!modoDemo()) {
          const resultado = await apiFetch<{ estado: EstadoEmpresa }>(
            `/empresas/${empresaId}/observaciones/marcar-atendidas`,
            { method: "POST" }
          );
          set({
            observaciones: get().observaciones.map((o) =>
              o.empresaId === empresaId && o.estado !== "cerrada" ? { ...o, estado: "en_revision" } : o
            ),
          });
          return resultado.estado;
        }

        set({
          observaciones: get().observaciones.map((o) =>
            o.empresaId === empresaId && o.estado !== "cerrada" ? { ...o, estado: "en_revision" } : o
          ),
        });
        return "observaciones_atendidas";
      },

      async cerrarObservacionesDeEmpresa(empresaId) {
        if (!modoDemo()) {
          await apiFetch(`/empresas/${empresaId}/observaciones/cerrar`, { method: "POST" });
        }
        set({
          observaciones: get().observaciones.map((o) =>
            o.empresaId === empresaId && o.estado !== "cerrada" ? { ...o, estado: "cerrada" } : o
          ),
        });
      },
    }),
    { name: "leanstart-observaciones", skipHydration: true }
  )
);
