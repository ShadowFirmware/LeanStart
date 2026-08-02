"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, FileWarning } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// El zoom es un multiplicador sobre el ancho disponible del lienzo, no sobre
// el tamaño nativo de la página del PDF: así, sin importar qué tan grande sea
// la página original, al abrir el visor siempre se ve completa (100% = ajustada
// al ancho del modal) en vez de aparecer ya "acercada" y desbordando la caja.
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.2;

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
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState(false);

  // "Regla" invisible que nunca contiene al PDF: mide el ancho disponible sin
  // depender del tamaño del canvas. Medir el contenedor que SÍ tiene el PDF
  // adentro crea un ciclo (el canvas se agranda → el contenedor "crece" con
  // él → el nuevo ancho medido agranda aún más al canvas...), que es lo que
  // causaba el error y el parpadeo al hacer zoom.
  const rulerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);

  useEffect(() => {
    const el = rulerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = Math.round(entries[0]?.contentRect.width ?? 0);
      setCanvasWidth((prev) => (Math.abs(prev - width) > 1 ? width : prev));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Deja un margen (32px) para que la página no toque el borde del lienzo.
  const pageWidth = canvasWidth > 32 ? (canvasWidth - 32) * zoom : undefined;

  // Arrastrar para desplazar el PDF cuando está acercado (zoom > 100%).
  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });
  const [dragging, setDragging] = useState(false);
  const puedeArrastrar = zoom > 1;

  function handleMouseDown(e: React.MouseEvent) {
    if (!puedeArrastrar) return;
    const el = scrollBoxRef.current;
    if (!el) return;
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop };
    setDragging(true);
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!dragRef.current.dragging) return;
      const el = scrollBoxRef.current;
      if (!el) return;
      el.scrollLeft = dragRef.current.scrollLeft - (e.clientX - dragRef.current.startX);
      el.scrollTop = dragRef.current.scrollTop - (e.clientY - dragRef.current.startY);
    }
    function handleMouseUp() {
      if (!dragRef.current.dragging) return;
      dragRef.current.dragging = false;
      setDragging(false);
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 min-w-0 w-full">
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
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
            disabled={zoom <= MIN_ZOOM}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={toolbarButtonStyle}
            aria-label="Alejar"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-medium min-w-[42px] text-center" style={{ color: "var(--text-dim)" }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
            disabled={zoom >= MAX_ZOOM}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={toolbarButtonStyle}
            aria-label="Acercar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Regla invisible: mismo ancho que el lienzo, pero sin el PDF adentro. */}
      <div ref={rulerRef} className="w-full h-0" aria-hidden="true" />

      {/* Lienzo del documento */}
      <div
        className="rounded-lg overflow-hidden min-w-0 w-full"
        style={{ height: "calc(80vh - 52px)", border: "1px solid var(--border-hair)", backgroundColor: "rgba(0,0,0,0.35)" }}
      >
        {error ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center py-20 px-6">
            <FileWarning className="w-10 h-10" style={{ color: "var(--text-faint)" }} />
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>No se pudo mostrar el PDF. Descárgalo para verlo.</p>
          </div>
        ) : (
          <div
            ref={scrollBoxRef}
            onMouseDown={handleMouseDown}
            onDragStart={(e) => e.preventDefault()}
            className="w-full h-full overflow-auto select-none"
            style={{ cursor: puedeArrastrar ? (dragging ? "grabbing" : "grab") : "default" }}
          >
            {/* w-fit + mx-auto (en vez de justify-center en el contenedor con
                scroll): centra la página cuando cabe, pero cuando se desborda
                por el zoom queda pegada a la izquierda con todo su ancho
                alcanzable arrastrando. `justify-center` en un contenedor con
                overflow deja la mitad izquierda del contenido fuera de rango
                de scroll (un problema conocido de CSS), lo que impedía
                arrastrar hacia la izquierda. */}
            <div className="w-fit mx-auto">
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
                {pageWidth && <Page pageNumber={pageNumber} width={pageWidth} className="shadow-lg" />}
              </Document>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
