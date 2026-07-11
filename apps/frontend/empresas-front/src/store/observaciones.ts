import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EstadoEmpresa, EstadoObservacion } from "@leanstart/commons";

/**
 * Colaboración en vivo (estilo Google Docs): las observaciones son SIEMPRE visibles para
 * cualquiera con acceso al proyecto. El emprendedor ve los comentarios del mentor en tiempo
 * real, sin esperar a que el mentor "envíe" las correcciones; y el mentor ve las respuestas
 * del emprendedor al instante. La sincronización entre pestañas mantiene todo actualizado.
 */
export function puedeVerObservaciones(
  _estado: EstadoEmpresa,
  _readOnly: boolean,
  _permitirComentarios: boolean
): boolean {
  return true;
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
 * Estados en los que el emprendedor puede editar su proyecto. Con la colaboración en vivo
 * también puede corregir durante la mentoría (sin esperar a que el mentor se lo devuelva).
 */
export function emprendedorPuedeEditar(estado: EstadoEmpresa): boolean {
  return estado === "borrador" || estado === "devuelto" || ESTADOS_MENTORIA.includes(estado);
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
    { name: "leanstart-observaciones", skipHydration: true }
  )
);
