// Espejo de apps/frontend/commons/src/types/index.ts — mantener sincronizado.

export type EstadoEmpresa =
  | "borrador"
  | "pendiente_mentoria"
  | "en_mentoria"
  | "observaciones_pendientes"
  | "observaciones_atendidas"
  | "pendiente_evaluacion"
  | "en_evaluacion"
  | "publicado"
  | "devuelto";

export type EstadoHipotesis = "pendiente_validacion" | "validada" | "invalidada";

// "borrador": el mentor la dejó pero no ha enviado su retroalimentación todavía —
// invisible para el emprendedor hasta que el mentor la envíe (ver "enviar" más abajo).
export type EstadoObservacion = "borrador" | "pendiente" | "resuelta" | "en_revision" | "atendida" | "cerrada";

export type GiroEmpresa =
  | "tecnologia"
  | "educacion"
  | "salud"
  | "sustentabilidad"
  | "alimentacion"
  | "comercio"
  | "servicios";

export type TipoProducto = "producto" | "servicio";

export type ModalidadPrecioServicio = "rango" | "periodo" | "personalizado";

export type UnidadTiempoServicio = "dia" | "semana" | "mes" | "anio";

export type TipoExperimento =
  | "encuesta"
  | "entrevista"
  | "landing_page"
  | "prototipo"
  | "prueba_de_mercado"
  | "otro";

export type TipoElementoObservacion = "canvas" | "producto" | "hipotesis" | "general";

export type TipoEvidencia = "pdf" | "imagen" | "documento" | "url";

export type TipoNotificacion =
  | "comentario_mentor"
  | "cambio_emprendedor"
  | "enviado_evaluacion"
  | "proyecto_publicado"
  | "proyecto_devuelto"
  | "proyecto_asignado";

export type TipoReporte = "boleta" | "canvas";

export const GIRO_LABELS: Record<GiroEmpresa, string> = {
  tecnologia: "Tecnología",
  educacion: "Educación",
  salud: "Salud",
  sustentabilidad: "Sustentabilidad",
  alimentacion: "Alimentación",
  comercio: "Comercio",
  servicios: "Servicios",
};
