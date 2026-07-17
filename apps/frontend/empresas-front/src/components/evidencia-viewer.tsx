"use client";

import { useState } from "react";
import { ExternalLink, FileText, Download } from "lucide-react";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@leanstart/commons";
import type { TipoEvidencia } from "../store/empresas";

interface EvidenciaViewerButtonProps {
  /** Data URL base64 (imagen/pdf/documento) o URL externa (no usado para "url"). */
  evidencia: string;
  tipoEvidencia: TipoEvidencia;
  evidenciaNombre?: string;
  /** Texto del botón que dispara el visor. Por defecto "Abrir". */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Botón que abre las evidencias (imagen / PDF) en un modal dentro de la app,
 * en lugar de mandar al usuario a una pestaña externa. Los documentos que no
 * se pueden previsualizar (docx, xlsx, …) ofrecen descarga desde el mismo modal.
 */
export function EvidenciaViewerButton({
  evidencia,
  tipoEvidencia,
  evidenciaNombre,
  label = "Abrir",
  className,
  style,
}: EvidenciaViewerButtonProps) {
  const [open, setOpen] = useState(false);
  const titulo = evidenciaNombre || "Evidencia";

  return (
    <>
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
        <ExternalLink className="w-3 h-3" /> {label}
      </button>

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

          <div className="p-4" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
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
              <iframe
                src={evidencia}
                title={titulo}
                className="w-full rounded-lg"
                style={{ height: "80vh", border: "1px solid var(--border-hair)", backgroundColor: "#fff" }}
              />
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
