"use client";

import { useRef } from "react";
import { ImagePlus, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { compressImageToDataUrl } from "@leanstart/commons";

const MAX_IMAGENES = 6;
const RECOMENDADO = 3;
const MAX_MB = 2;

interface ProductoImagenesFieldProps {
  value: string[];
  onChange: (imagenes: string[]) => void;
  disabled?: boolean;
}

/**
 * Galería de imágenes de un producto. Mínimo 3 recomendado (no obligatorio),
 * máximo 6, cada archivo ≤ 2MB. Las miniaturas se muestran uniformes y el
 * usuario puede eliminar cualquiera o agregar más hasta el tope.
 */
export function ProductoImagenesField({ value, onChange, disabled = false }: ProductoImagenesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const faltantes = Math.max(0, RECOMENDADO - value.length);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const espacio = MAX_IMAGENES - value.length;
    if (espacio <= 0) {
      toast.error(`Máximo ${MAX_IMAGENES} imágenes por producto.`);
      return;
    }

    const seleccionados = Array.from(files).slice(0, espacio);
    if (files.length > espacio) {
      toast.warning(`Solo se agregaron ${espacio} imágen(es); alcanzaste el máximo de ${MAX_IMAGENES}.`);
    }

    const nuevas: string[] = [];
    for (const file of seleccionados) {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" no es una imagen.`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`"${file.name}" supera los ${MAX_MB}MB.`);
        continue;
      }
      try {
        nuevas.push(await compressImageToDataUrl(file));
      } catch {
        toast.error(`No se pudo leer "${file.name}".`);
      }
    }

    if (nuevas.length > 0) {
      onChange([...value, ...nuevas]);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function quitar(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      {/* Grilla de miniaturas + botón de agregar */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {value.map((src, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-xl overflow-hidden group"
            style={{ border: "1px solid var(--border-hair)", backgroundColor: "var(--hover-surface-2)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover" />
            {i === 0 && (
              <span
                className="absolute bottom-1 left-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
                style={{ backgroundColor: "var(--shell-header)", color: "var(--brand-accent)" }}
              >
                Portada
              </span>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={() => quitar(i)}
                className="absolute top-1 right-1 flex items-center justify-center w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: "var(--shell-header)", color: "var(--text-strong)" }}
                aria-label={`Quitar imagen ${i + 1}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        {!disabled && value.length < MAX_IMAGENES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
            style={{
              backgroundColor: "rgba(154,98,250,0.08)",
              border: "2px dashed rgba(154,98,250,0.3)",
              color: "var(--brand)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--brand-line)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.3)")}
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-[10px] font-medium">Agregar</span>
          </button>
        )}
      </div>

      {/* Contador + aviso */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs" style={{ color: "var(--text-faint)" }}>
          {value.length} / {MAX_IMAGENES} · máx. {MAX_MB}MB c/u
        </span>
        {faltantes > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "#F59E0B" }}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Se recomiendan al menos {RECOMENDADO} imágenes (faltan {faltantes}).
          </span>
        )}
      </div>
    </div>
  );
}
