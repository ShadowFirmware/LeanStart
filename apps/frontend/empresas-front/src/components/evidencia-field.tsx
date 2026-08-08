"use client";

import { useRef, useState } from "react";
import { Upload, RefreshCw, X as XIcon, Link2, AlertCircle } from "lucide-react";
import { Button, Spinner } from "@leanstart/commons";
import type { TipoEvidencia } from "../store/empresas";
import { estiloEvidencia, tamanoDeDataUrl, formatearTamano } from "../lib/evidencia-icono";
import { EvidenciaViewerButton } from "./evidencia-viewer";

/** Tipos ofrecidos, en el orden en que se muestran. */
const TIPOS: { tipo: TipoEvidencia; label: string; hint: string }[] = [
  { tipo: "pdf", label: "PDF", hint: "Archivo .pdf" },
  { tipo: "imagen", label: "Imagen", hint: "JPG, PNG, WEBP…" },
  { tipo: "documento", label: "Word / Excel", hint: ".doc, .docx, .xls, .xlsx, .csv" },
  { tipo: "url", label: "Enlace", hint: "Una URL pública" },
];

/** ¿El archivo soltado corresponde al tipo elegido? Espeja el `accept` del input. */
function archivoAceptado(file: File, tipo: TipoEvidencia): boolean {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (tipo === "imagen") return file.type.startsWith("image/");
  if (tipo === "pdf") return ext === "pdf" || file.type === "application/pdf";
  return ["doc", "docx", "xls", "xlsx", "csv"].includes(ext);
}

interface EvidenciaFieldProps {
  tipo: TipoEvidencia | "";
  onTipoChange: (tipo: TipoEvidencia | "") => void;
  /** Data URL del archivo cargado (imagen / pdf / documento). */
  dataUrl: string;
  nombre: string;
  /** Valor cuando `tipo === "url"`. */
  url: string;
  onUrlChange: (valor: string) => void;
  onArchivo: (file: File) => void;
  onLimpiar: () => void;
  /** El archivo se está leyendo/comprimiendo. */
  subiendo?: boolean;
  disabled?: boolean;
}

/**
 * Campo de evidencia de una hipótesis: elegir tipo, subir el archivo (o pegar
 * una URL) y revisar lo cargado.
 *
 * Vive aquí, y no duplicado en el asistente y en la edición de hipótesis, que
 * es donde estaban las dos copias de este mismo bloque. El estado sigue siendo
 * de quien lo usa —cada pantalla guarda a su manera—; este componente solo
 * presenta y avisa de los cambios.
 */
export function EvidenciaField({
  tipo,
  onTipoChange,
  dataUrl,
  nombre,
  url,
  onUrlChange,
  onArchivo,
  onLimpiar,
  subiendo = false,
  disabled = false,
}: EvidenciaFieldProps) {
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const esArchivo = tipo !== "" && tipo !== "url";
  const estilo = tipo === "" ? null : estiloEvidencia(tipo, nombre);
  const hint = TIPOS.find((t) => t.tipo === tipo)?.hint ?? "";

  function recibirArchivo(file: File | undefined) {
    if (!file || !esArchivo) return;
    if (!archivoAceptado(file, tipo)) {
      setError(`Ese archivo no corresponde al tipo elegido. Se esperaba: ${hint}.`);
      return;
    }
    setError(null);
    onArchivo(file);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Selector de tipo: ícono + color propios de cada formato */}
      <div className="flex flex-wrap gap-2">
        {TIPOS.map(({ tipo: t, label }) => {
          const { Icon, color, tint } = estiloEvidencia(t);
          const activo = tipo === t;
          return (
            <button
              key={t}
              type="button"
              disabled={disabled}
              onClick={() => {
                setError(null);
                onTipoChange(activo ? "" : t);
              }}
              aria-pressed={activo}
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 h-8 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: activo ? color : "var(--text-dim)",
                backgroundColor: activo ? tint : "var(--hover-surface)",
                border: `1px solid ${activo ? color : "var(--border-hair)"}`,
              }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: activo ? color : "var(--text-faint)" }} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Enlace externo */}
      {tipo === "url" && (
        <div className="relative">
          <Link2
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--text-faint)" }}
          />
          <input
            type="url"
            placeholder="https://…"
            value={url}
            maxLength={300}
            disabled={disabled}
            onChange={(e) => onUrlChange(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm outline-none transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "var(--input-surface)",
              border: "1px solid var(--border-hair)",
              color: "var(--text-strong)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-hair)")}
          />
        </div>
      )}

      {/* Zona de subida: arrastrar o hacer clic */}
      {esArchivo && !dataUrl && estilo && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={estilo.accept}
            className="hidden"
            onChange={(e) => {
              recibirArchivo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={disabled || subiendo}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled && !subiendo) setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              if (disabled || subiendo) return;
              recibirArchivo(e.dataTransfer.files?.[0]);
            }}
            aria-busy={subiendo || undefined}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl px-4 py-7 transition-colors disabled:cursor-not-allowed"
            style={{
              backgroundColor: arrastrando ? estilo.tint : "var(--hover-surface-2)",
              border: `1px dashed ${arrastrando ? estilo.color : "var(--border-hair)"}`,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <span
              className="flex items-center justify-center w-11 h-11 rounded-xl"
              style={{ backgroundColor: estilo.tint, border: `1px solid ${estilo.color}33` }}
            >
              {subiendo ? <Spinner size={20} /> : <Upload className="w-5 h-5" style={{ color: estilo.color }} />}
            </span>
            <span className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>
              {subiendo ? "Procesando archivo…" : arrastrando ? "Suelta el archivo aquí" : "Arrastra tu archivo o haz clic para buscarlo"}
            </span>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>{hint}</span>
          </button>
        </>
      )}

      {/* Archivo cargado */}
      {esArchivo && dataUrl && estilo && (
        <div
          className="rounded-xl p-3 flex items-start gap-3"
          style={{ backgroundColor: estilo.tint, border: `1px solid ${estilo.color}40` }}
        >
          {tipo === "imagen" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt={nombre || "Evidencia"}
              className="w-20 h-20 rounded-lg object-cover shrink-0"
              style={{ border: "1px solid var(--border-hair)" }}
            />
          ) : (
            <span
              className="w-20 h-20 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--surface-profile)", border: `1px solid ${estilo.color}40` }}
            >
              <estilo.Icon className="w-8 h-8" style={{ color: estilo.color }} />
            </span>
          )}

          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium break-words"
              style={{ color: "var(--text-strong)", overflowWrap: "anywhere" }}
            >
              {nombre || "Archivo cargado"}
            </p>
            <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: "var(--text-dim)" }}>
              <span className="font-medium" style={{ color: estilo.color }}>{estilo.label}</span>
              {formatearTamano(tamanoDeDataUrl(dataUrl)) && (
                <>
                  <span aria-hidden>·</span>
                  {formatearTamano(tamanoDeDataUrl(dataUrl))}
                </>
              )}
            </p>

            <div className="flex flex-wrap gap-2 mt-2.5">
              <EvidenciaViewerButton evidencia={dataUrl} tipoEvidencia={tipo} evidenciaNombre={nombre} label="Ver" />

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                loading={subiendo}
                loadingText="Procesando…"
                onClick={() => inputRef.current?.click()}
                className="h-7 text-[11px]"
              >
                <RefreshCw className="w-3 h-3" /> Reemplazar
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept={estilo.accept}
                className="hidden"
                onChange={(e) => {
                  recibirArchivo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={disabled || subiendo}
                onClick={() => {
                  setError(null);
                  onLimpiar();
                }}
                className="h-7 text-[11px]"
              >
                <XIcon className="w-3 h-3" /> Quitar
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="flex items-start gap-1.5 text-xs" style={{ color: "#EF4444" }}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
          {error}
        </p>
      )}
    </div>
  );
}
