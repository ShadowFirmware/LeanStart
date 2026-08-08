import { FileText, FilePenLine, FileSpreadsheet, Image, Link2, type LucideIcon } from "lucide-react";
import { detectarDocumentoSubtipo, DOCUMENTO_SUBTIPO_LABEL } from "./documento-tipo";
import type { TipoEvidencia } from "../store/empresas";

/** Ícono representativo de cada evidencia, según su tipo (y subtipo para "documento"). */
export function iconoEvidencia(tipo: TipoEvidencia, nombre?: string): LucideIcon {
  return estiloEvidencia(tipo, nombre).Icon;
}

export interface EstiloEvidencia {
  Icon: LucideIcon;
  /** Etiqueta legible ("PDF", "Excel", "Imagen"…). */
  label: string;
  /** Color de acento del tipo, para el ícono y sus fondos. */
  color: string;
  /** Fondo tenue derivado del color, para la caja del ícono. */
  tint: string;
  /** Valor del atributo `accept` del input de archivo. */
  accept: string;
}

/**
 * Identidad visual de cada tipo de evidencia: ícono, etiqueta y color. Tener un
 * color propio por tipo (PDF rojo, Excel verde, Word azul…) hace que un adjunto
 * se reconozca de un vistazo, sin leer el nombre del archivo.
 */
export function estiloEvidencia(tipo: TipoEvidencia, nombre?: string): EstiloEvidencia {
  if (tipo === "imagen") {
    return { Icon: Image, label: "Imagen", color: "#14B8A6", tint: "rgba(20,184,166,0.12)", accept: "image/*" };
  }
  if (tipo === "url") {
    return { Icon: Link2, label: "Enlace", color: "#9A62FA", tint: "rgba(154,98,250,0.12)", accept: "" };
  }
  if (tipo === "pdf") {
    return { Icon: FileText, label: "PDF", color: "#EF4444", tint: "rgba(239,68,68,0.12)", accept: ".pdf" };
  }

  // "documento": Excel/CSV se distingue de Word con ícono y color de hoja de cálculo.
  const subtipo = detectarDocumentoSubtipo(nombre);
  const accept = ".doc,.docx,.xls,.xlsx,.csv";
  if (subtipo === "excel" || subtipo === "csv") {
    return {
      Icon: FileSpreadsheet,
      label: DOCUMENTO_SUBTIPO_LABEL[subtipo],
      color: "#10B981",
      tint: "rgba(16,185,129,0.12)",
      accept,
    };
  }
  return {
    Icon: FilePenLine,
    label: DOCUMENTO_SUBTIPO_LABEL[subtipo],
    color: "#3B82F6",
    tint: "rgba(59,130,246,0.12)",
    accept,
  };
}

/**
 * Peso aproximado de un data URL base64, en bytes. Las evidencias se guardan
 * embebidas en el propio registro, así que no hay un `size` que consultar: se
 * deriva del largo de la cadena (cada 4 caracteres base64 = 3 bytes).
 */
export function tamanoDeDataUrl(dataUrl?: string): number {
  if (!dataUrl) return 0;
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  if (!base64) return 0;
  const relleno = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - relleno);
}

/** Formatea bytes como "820 KB" / "1.4 MB". */
export function formatearTamano(bytes: number): string {
  if (bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
