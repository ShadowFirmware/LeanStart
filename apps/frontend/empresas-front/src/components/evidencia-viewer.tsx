"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Eye, FileText, Download } from "lucide-react";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@leanstart/commons";
import type { TipoEvidencia } from "../store/empresas";

// pdfjs-dist toca APIs de navegador (DOMMatrix, canvas, …) en su inicialización,
// así que el visor debe cargarse solo en cliente: si Next.js lo evalúa durante
// el server render, la app truena.
const PdfViewer = dynamic(() => import("./pdf-viewer").then((m) => m.PdfViewer), { ssr: false });

interface EvidenciaViewerButtonProps {
  /** Data URL base64 (imagen/pdf/documento) o URL externa (no usado para "url"). */
  evidencia: string;
  tipoEvidencia: TipoEvidencia;
  evidenciaNombre?: string;
  /** Texto del botón que dispara el visor. Por defecto "Abrir". Se ignora si se pasa `children`. */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Si se pasa, reemplaza el botón por defecto: todo el contenido actúa como disparador clicable. */
  children?: React.ReactNode;
}

/**
 * Abre las evidencias (imagen / PDF) en un modal dentro de la app, en lugar
 * de mandar al usuario a una pestaña externa. Los documentos que no se
 * pueden previsualizar (docx, xlsx, …) ofrecen descarga desde el mismo modal.
 * Sin `children`, se dibuja como un botón "Abrir"; con `children`, todo el
 * contenido pasado actúa como disparador clicable.
 */
export function EvidenciaViewerButton({
  evidencia,
  tipoEvidencia,
  evidenciaNombre,
  label = "Abrir",
  className,
  style,
  children,
}: EvidenciaViewerButtonProps) {
  const [open, setOpen] = useState(false);
  const titulo = evidenciaNombre || "Evidencia";

  return (
    <>
      {children ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className={className ?? "cursor-pointer"}
          style={style}
        >
          {children}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            className ??
            "inline-flex items-center gap-1 text-[11px] px-2.5 h-7 rounded-md transition-colors"
          }
          style={
            style ?? {
              color: "var(--brand-accent)",
              backgroundColor: "rgba(154,98,250,0.1)",
              border: "1px solid var(--brand-tint-strong)",
            }
          }
        >
          <Eye className="w-3 h-3" /> {label}
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[900px] p-0 overflow-hidden">
          <div
            className="flex items-center justify-between gap-3 px-5 py-3"
            style={{ borderBottom: "1px solid var(--border-hair)" }}
          >
            <div className="min-w-0">
              <DialogTitle className="text-sm font-medium truncate" style={{ color: "var(--text-strong)" }}>
                {titulo}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                {tipoEvidencia === "imagen" ? "Imagen" : tipoEvidencia === "pdf" ? "PDF" : "Documento"}
              </DialogDescription>
            </div>
            <a
              href={evidencia}
              download={evidenciaNombre || true}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 h-7 rounded-md transition-colors shrink-0 mr-8"
              style={{ color: "var(--brand-accent)", backgroundColor: "rgba(154,98,250,0.1)", border: "1px solid var(--brand-tint-strong)" }}
            >
              <Download className="w-3 h-3" /> Descargar
            </a>
          </div>

          {/* min-w-0: DialogContent es un grid; sin esto, la celda crece según
              el max-content de lo que haya adentro (el canvas del PDF), y ese
              ancho más grande retroalimentaba el cálculo de zoom del visor en
              un ciclo infinito. */}
          <div className="p-4 min-w-0" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
            {tipoEvidencia === "imagen" ? (
              <div
                className="flex items-center justify-center rounded-lg overflow-hidden"
                style={{
                  height: "80vh",
                  border: "1px solid var(--border-hair)",
                  backgroundColor: "rgba(0,0,0,0.35)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={evidencia}
                  alt={titulo}
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                />
              </div>
            ) : tipoEvidencia === "pdf" ? (
              <PdfViewer file={evidencia} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <FileText className="w-12 h-12" style={{ color: "var(--brand-accent)" }} />
                <p className="text-sm" style={{ color: "var(--text-strong)" }}>{titulo}</p>
                <p className="text-xs max-w-sm" style={{ color: "var(--text-dim)" }}>
                  Este tipo de documento no se puede previsualizar. Descárgalo para abrirlo.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
