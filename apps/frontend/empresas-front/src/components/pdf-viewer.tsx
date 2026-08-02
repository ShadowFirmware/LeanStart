"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, FileWarning } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.4;
const SCALE_STEP = 0.2;

const toolbarButtonStyle: React.CSSProperties = {
  color: "var(--brand-accent)",
  backgroundColor: "rgba(154,98,250,0.1)",
  border: "1px solid var(--brand-tint-strong)",
};

interface PdfViewerProps {
  /** Data URL base64 o URL del archivo PDF. */
  file: string;
}

/**
 * Visor de PDF con controles propios (página, zoom) en vez de la barra de
 * herramientas nativa del navegador, para que se vea integrado a la app.
 */
export function PdfViewer({ file }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [error, setError] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {/* Barra de herramientas propia */}
      <div
        className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg"
        style={{ backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)" }}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={toolbarButtonStyle}
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-medium min-w-[76px] text-center" style={{ color: "var(--text-dim)" }}>
            Página {pageNumber}{numPages ? ` / ${numPages}` : ""}
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.min(numPages ?? p, p + 1))}
            disabled={!numPages || pageNumber >= numPages}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={toolbarButtonStyle}
            aria-label="Página siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)))}
            disabled={scale <= MIN_SCALE}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={toolbarButtonStyle}
            aria-label="Alejar"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-medium min-w-[42px] text-center" style={{ color: "var(--text-dim)" }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)))}
            disabled={scale >= MAX_SCALE}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={toolbarButtonStyle}
            aria-label="Acercar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Lienzo del documento */}
      <div
        className="flex items-start justify-center overflow-auto rounded-lg"
        style={{ height: "calc(80vh - 52px)", border: "1px solid var(--border-hair)", backgroundColor: "rgba(0,0,0,0.35)" }}
      >
        {error ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center py-20 px-6">
            <FileWarning className="w-10 h-10" style={{ color: "var(--text-faint)" }} />
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>No se pudo mostrar el PDF. Descárgalo para verlo.</p>
          </div>
        ) : (
          <Document
            file={file}
            onLoadSuccess={({ numPages: n }) => { setNumPages(n); setPageNumber(1); }}
            onLoadError={() => setError(true)}
            loading={
              <div className="flex flex-col items-center justify-center gap-2 py-24">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand)" }} />
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>Cargando documento…</span>
              </div>
            }
            className="py-4"
          >
            <Page pageNumber={pageNumber} scale={scale} className="shadow-lg" />
          </Document>
        )}
      </div>
    </div>
  );
}
