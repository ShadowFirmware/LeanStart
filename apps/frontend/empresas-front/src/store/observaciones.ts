import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EstadoEmpresa, EstadoObservacion } from "@leanstart/commons";

/**
 * Determina si el emprendedor puede ver el hilo de observaciones de un elemento según
 * el estado actual del proyecto. Solo se le revela cuando el mentor formalmente "envía"
 * el proyecto de vuelta — no en tiempo real mientras el mentor lo está redactando o revisando.
 * El mentor (y los roles de solo consulta) siempre pueden ver el hilo completo, ya que son
 * autores/observadores del mismo; lo que se restringe por separado es su capacidad de
 * comentar/confirmar (ver `mentorPuedeComentar` en cada vista).
 */
export function puedeVerObservaciones(
  estado: EstadoEmpresa,
  readOnly: boolean,
  permitirComentarios: boolean
): boolean {
  if (!readOnly) {
    // Emprendedor: ve el hilo solo cuando el mentor ya se lo envió (no mientras el mentor lo redacta o lo revisa de nuevo).
    return estado !== "en_mentoria" && estado !== "observaciones_atendidas";
  }
  // Mentor y otros roles de solo consulta (admin/evaluador): siempre visible.
  return true;
}

/** A qué tipo de elemento de la empresa está vinculada la observación. */
export type TipoElementoObservacion = "canvas" | "producto" | "hipotesis";

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
  agregarObservacion: (data: {
    empresaId: string;
    tipoElemento: TipoElementoObservacion;
    elementoId: string;
    autorNombre: string;
    comentario: string;
  }) => void;
  actualizarEstadoObservacion: (id: string, estado: EstadoObservacion) => void;
  eliminarObservacion: (id: string) => void;
  cerrarObservacionesDeEmpresa: (empresaId: string) => void;
}

export const useObservacionesStore = create<ObservacionesStore>()(
  persist(
    (set, get) => ({
      observaciones: [],

      agregarObservacion(data) {
        const id = crypto.randomUUID();
        const ahora = new Date().toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const nueva: Observacion = { id, ...data, estado: "pendiente", creadaEn: ahora };
        set({ observaciones: [nueva, ...get().observaciones] });
      },

      actualizarEstadoObservacion(id, estado) {
        set({
          observaciones: get().observaciones.map((o) => (o.id === id ? { ...o, estado } : o)),
        });
      },

      eliminarObservacion(id) {
        set({ observaciones: get().observaciones.filter((o) => o.id !== id) });
      },

      cerrarObservacionesDeEmpresa(empresaId) {
        set({
          observaciones: get().observaciones.map((o) =>
            o.empresaId === empresaId && o.estado !== "cerrada" ? { ...o, estado: "cerrada" } : o
          ),
        });
      },
    }),
    { name: "leanstart-observaciones" }
  )
);
