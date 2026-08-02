"use client";

import { useEffect, useState } from "react";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { Loader2, FileWarning, FileText } from "lucide-react";
import { detectarDocumentoSubtipo } from "../lib/documento-tipo";

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const toolbarButtonStyle: React.CSSProperties = {
  color: "var(--brand-accent)",
  backgroundColor: "rgba(154,98,250,0.1)",
  border: "1px solid var(--brand-tint-strong)",
};

function SinPreview({ nombre }: { nombre?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <FileText className="w-12 h-12" style={{ color: "var(--brand-accent)" }} />
      <p className="text-sm" style={{ color: "var(--text-strong)" }}>{nombre || "Documento"}</p>
      <p className="text-xs max-w-sm" style={{ color: "var(--text-dim)" }}>
        Este formato no se puede previsualizar. Descárgalo para abrirlo.
      </p>
    </div>
  );
}

function WordViewer({ file }: { file: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setHtml(null);
    setError(false);
    mammoth
      .convertToHtml({ arrayBuffer: dataUrlToArrayBuffer(file) })
      .then((res) => { if (!cancelado) setHtml(res.value); })
      .catch(() => { if (!cancelado) setError(true); });
    return () => { cancelado = true; };
  }, [file]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 px-6 text-center">
        <FileWarning className="w-10 h-10" style={{ color: "var(--text-faint)" }} />
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>No se pudo mostrar este documento. Descárgalo para verlo.</p>
      </div>
    );
  }

  if (html === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand)" }} />
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>Cargando documento…</span>
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg" style={{ height: "80vh", border: "1px solid var(--border-hair)" }}>
      <style>{`
        .word-preview { font: 14px/1.6 -apple-system, "Segoe UI", Roboto, sans-serif; }
        .word-preview h1, .word-preview h2, .word-preview h3 { margin: 1em 0 0.4em; line-height: 1.3; }
        .word-preview p { margin: 0 0 0.8em; }
        .word-preview table { border-collapse: collapse; margin: 0.8em 0; }
        .word-preview td, .word-preview th { border: 1px solid #ddd; padding: 4px 8px; }
        .word-preview ul, .word-preview ol { margin: 0 0 0.8em; padding-left: 1.5em; }
        .word-preview img { max-width: 100%; }
      `}</style>
      <div
        className="mx-auto my-4 px-10 py-8 word-preview"
        style={{ maxWidth: 760, backgroundColor: "#fff", color: "#1a1a1a", boxShadow: "0 4px 20px rgba(0,0,0,0.35)", borderRadius: 4 }}
        // El HTML viene de mammoth (conversión local del .docx, no de un tercero) y solo
        // contiene marcado semántico básico (p, h1-h6, table, ul/ol, strong, em…).
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function ExcelViewer({ file }: { file: string }) {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [error, setError] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(0);

  useEffect(() => {
    setWorkbook(null);
    setError(false);
    setSheetIndex(0);
    try {
      const base64 = file.includes(",") ? file.split(",")[1] : file;
      setWorkbook(XLSX.read(base64, { type: "base64" }));
    } catch {
      setError(true);
    }
  }, [file]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 px-6 text-center">
        <FileWarning className="w-10 h-10" style={{ color: "var(--text-faint)" }} />
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>No se pudo mostrar esta hoja de cálculo. Descárgala para verla.</p>
      </div>
    );
  }

  if (!workbook) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand)" }} />
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>Cargando hoja de cálculo…</span>
      </div>
    );
  }

  const nombreHoja = workbook.SheetNames[sheetIndex];
  const hoja = workbook.Sheets[nombreHoja];
  const filas: unknown[][] = XLSX.utils.sheet_to_json(hoja, { header: 1, blankrows: false, defval: "" });

  return (
    <div className="flex flex-col gap-3">
      {workbook.SheetNames.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {workbook.SheetNames.map((nombre, i) => (
            <button
              key={nombre}
              type="button"
              onClick={() => setSheetIndex(i)}
              className="text-xs font-medium px-2.5 h-7 rounded-md transition-colors"
              style={i === sheetIndex ? toolbarButtonStyle : { color: "var(--text-dim)", backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)" }}
            >
              {nombre}
            </button>
          ))}
        </div>
      )}
      <div className="overflow-auto rounded-lg" style={{ height: workbook.SheetNames.length > 1 ? "calc(80vh - 44px)" : "80vh", border: "1px solid var(--border-hair)", backgroundColor: "#fff" }}>
        {filas.length === 0 ? (
          <p className="text-sm p-6" style={{ color: "#666" }}>Esta hoja no tiene datos.</p>
        ) : (
          <table className="text-xs border-collapse w-full">
            <tbody>
              {filas.map((fila, i) => (
                <tr key={i}>
                  {fila.map((celda, j) => (
                    <td key={j} className="px-3 py-1.5 whitespace-nowrap" style={{ border: "1px solid #e5e5e5", color: "#1a1a1a", backgroundColor: i === 0 ? "#f5f3ff" : "#fff", fontWeight: i === 0 ? 600 : 400 }}>
                      {String(celda)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

interface DocumentoViewerProps {
  /** Data URL base64 del archivo. */
  file: string;
  nombre?: string;
}

/** Previsualiza documentos Word (.docx) y Excel/CSV (.xlsx, .xls, .csv). El resto ofrece solo descarga. */
export function DocumentoViewer({ file, nombre }: DocumentoViewerProps) {
  const subtipo = detectarDocumentoSubtipo(nombre);

  if (subtipo === "word") return <WordViewer file={file} />;
  if (subtipo === "excel" || subtipo === "csv") return <ExcelViewer file={file} />;
  return <SinPreview nombre={nombre} />;
}
