"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Eye, Download } from "lucide-react";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@leanstart/commons";
import type { TipoEvidencia } from "../store/empresas";
import { detectarDocumentoSubtipo, DOCUMENTO_SUBTIPO_LABEL } from "../lib/documento-tipo";
import { iconoEvidencia } from "../lib/evidencia-icono";

// pdfjs-dist / mammoth / xlsx tocan APIs de navegador en su inicialización, así
// que estos visores deben cargarse solo en cliente: si Next.js los evalúa
// durante el server render, la app truena.
const PdfViewer = dynamic(() => import("./pdf-viewer").then((m) => m.PdfViewer), { ssr: false });
const DocumentoViewer = dynamic(() => import("./documento-viewer").then((m) => m.DocumentoViewer), { ssr: false });

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
                {tipoEvidencia === "imagen"
                  ? "Imagen"
                  : tipoEvidencia === "pdf"
                  ? "PDF"
                  : DOCUMENTO_SUBTIPO_LABEL[detectarDocumentoSubtipo(evidenciaNombre)]}
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
              <DocumentoViewer file={evidencia} nombre={evidenciaNombre} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface EvidenciaThumbProps {
  tipoEvidencia: TipoEvidencia;
  /** Data URL base64 (solo se usa cuando tipoEvidencia === "imagen"). */
  evidencia: string;
  evidenciaNombre?: string;
  /** "sm" para tarjetas compactas (listas), "lg" para previews grandes. Por defecto "sm". */
  size?: "sm" | "lg";
}

/**
 * Miniatura + ícono representativo del tipo de evidencia (PDF, Word, Excel/CSV,
 * imagen, URL). Para imágenes se muestra la miniatura real con una insignia
 * de ícono superpuesta; para el resto, un ícono dentro de una caja.
 */
export function EvidenciaThumb({ tipoEvidencia, evidencia, evidenciaNombre, size = "sm" }: EvidenciaThumbProps) {
  const Icon = iconoEvidencia(tipoEvidencia, evidenciaNombre);
  const caja = size === "lg" ? "w-20 h-20 rounded-lg" : "w-9 h-9 rounded-md";

  if (tipoEvidencia === "imagen") {
    const badge = size === "lg" ? "w-6 h-6" : "w-4 h-4";
    const badgeIcon = size === "lg" ? "w-3.5 h-3.5" : "w-2.5 h-2.5";
    return (
      <div className={`relative ${caja} overflow-hidden shrink-0`} style={{ border: "1px solid var(--border-hair)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={evidencia} alt={evidenciaNombre || "Evidencia"} className="w-full h-full object-cover" />
        <span
          className={`absolute bottom-0 right-0 flex items-center justify-center ${badge}`}
          style={{ backgroundColor: "rgba(0,0,0,0.6)", borderTopLeftRadius: 6 }}
        >
          <Icon className={badgeIcon} style={{ color: "#fff" }} />
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${caja} flex items-center justify-center shrink-0`}
      style={{ backgroundColor: "var(--hover-surface)", border: "1px solid var(--border-hair)" }}
    >
      <Icon className={size === "lg" ? "w-8 h-8" : "w-4 h-4"} style={{ color: "var(--brand-accent)" }} />
    </div>
  );
}
