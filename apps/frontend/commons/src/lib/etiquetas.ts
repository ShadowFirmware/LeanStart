import type { EstadoEmpresa, GiroEmpresa } from "../types";

/**
 * Etiquetas y colores de los tipos de dominio compartidos.
 *
 * Viven aquí porque los tipos que describen (`EstadoEmpresa`, `GiroEmpresa`)
 * también son de commons: cada microfrontend tenía su propia copia de estos
 * mapas y bastaba agregar un estado para que unas vistas lo pintaran y otras
 * mostraran `undefined`.
 */

/** Nombre legible de cada giro de empresa. */
export const GIRO_LABELS: Record<GiroEmpresa, string> = {
  tecnologia: "Tecnología",
  educacion: "Educación",
  salud: "Salud",
  sustentabilidad: "Sustentabilidad",
  alimentacion: "Alimentación",
  comercio: "Comercio",
  servicios: "Servicios",
};

export interface EstiloEstado {
  label: string;
  color: string;
  bg: string;
}

/** Etiqueta y colores del badge de estado de un proyecto. */
export const ESTADO_EMPRESA_CONFIG: Record<EstadoEmpresa, EstiloEstado> = {
  borrador: { label: "Borrador", color: "var(--brand)", bg: "var(--brand-tint)" },
  pendiente_mentoria: { label: "Pendiente de mentoría", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  en_mentoria: { label: "En mentoría", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  observaciones_pendientes: { label: "Obs. pendientes", color: "#F97316", bg: "rgba(249,115,22,0.12)" },
  observaciones_atendidas: { label: "Obs. atendidas", color: "#14B8A6", bg: "rgba(20,184,166,0.12)" },
  pendiente_evaluacion: { label: "Pendiente de evaluación", color: "#EAB308", bg: "rgba(234,179,8,0.12)" },
  en_evaluacion: { label: "En evaluación", color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
  publicado: { label: "Publicado", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  devuelto: { label: "Devuelto", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};
