import { FileText, FilePenLine, FileSpreadsheet, Image, Link2, type LucideIcon } from "lucide-react";
import { detectarDocumentoSubtipo } from "./documento-tipo";
import type { TipoEvidencia } from "../store/empresas";

/** Ícono representativo de cada evidencia, según su tipo (y subtipo para "documento"). */
export function iconoEvidencia(tipo: TipoEvidencia, nombre?: string): LucideIcon {
  if (tipo === "imagen") return Image;
  if (tipo === "url") return Link2;
  if (tipo === "pdf") return FileText;

  // "documento": Excel/CSV se distingue de Word con un ícono de hoja de cálculo.
  const subtipo = detectarDocumentoSubtipo(nombre);
  if (subtipo === "excel" || subtipo === "csv") return FileSpreadsheet;
  return FilePenLine;
}
