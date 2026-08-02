export type DocumentoSubtipo = "word" | "word-legacy" | "excel" | "csv" | "desconocido";

const EXTENSIONES: Record<string, DocumentoSubtipo> = {
  docx: "word",
  doc: "word-legacy",
  xlsx: "excel",
  xls: "excel",
  csv: "csv",
};

/** Deduce el subtipo de un archivo "documento" (Word/Excel/CSV) a partir de su nombre. */
export function detectarDocumentoSubtipo(nombre?: string): DocumentoSubtipo {
  const ext = (nombre?.split(".").pop() || "").toLowerCase();
  return EXTENSIONES[ext] ?? "desconocido";
}

export const DOCUMENTO_SUBTIPO_LABEL: Record<DocumentoSubtipo, string> = {
  word: "Word",
  "word-legacy": "Word (formato antiguo)",
  excel: "Excel",
  csv: "CSV",
  desconocido: "Documento",
};
