"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { compressImageToDataUrl, fileToDataUrl } from "@leanstart/commons";
import type { ResultadosHipotesis, TipoEvidencia } from "../store/empresas";

/** Tope de peso del adjunto: las evidencias viven embebidas en el registro. */
export const MAX_EVIDENCIA_BYTES = 3 * 1024 * 1024;

export interface EstadoEvidencia {
  tipo: TipoEvidencia | "";
  cambiarTipo: (tipo: TipoEvidencia | "") => void;
  dataUrl: string;
  nombre: string;
  url: string;
  setUrl: (valor: string) => void;
  /** El archivo se está leyendo/comprimiendo. */
  subiendo: boolean;
  cargarArchivo: (file: File) => Promise<void>;
  limpiar: () => void;
  /** Re-sincroniza con los resultados guardados (al cancelar una edición). */
  reiniciar: (resultados?: ResultadosHipotesis) => void;
  /** Hay un tipo elegido pero nada cargado todavía. */
  incompleta: boolean;
  /** Trozo de `ResultadosHipotesis` listo para persistir. */
  valor: Pick<ResultadosHipotesis, "evidencia" | "evidenciaNombre" | "tipoEvidencia">;
}

function dataUrlInicial(resultados?: ResultadosHipotesis): string {
  return resultados?.tipoEvidencia && resultados.tipoEvidencia !== "url" ? (resultados.evidencia ?? "") : "";
}

function urlInicial(resultados?: ResultadosHipotesis): string {
  return resultados?.tipoEvidencia === "url" ? (resultados.evidencia ?? "") : "";
}

/**
 * Estado de la evidencia de una hipótesis: tipo elegido, archivo o enlace, y la
 * lectura del archivo con sus avisos.
 *
 * Lo comparten el asistente de hipótesis y la vista de edición, que antes
 * repetían los cuatro `useState`, el `handleEvidenciaFile` y el `limpiar`
 * palabra por palabra. Se acompaña de <EvidenciaField/>, que es su interfaz.
 */
export function useEvidencia(resultados?: ResultadosHipotesis): EstadoEvidencia {
  const [tipo, setTipo] = useState<TipoEvidencia | "">(resultados?.tipoEvidencia ?? "");
  const [dataUrl, setDataUrl] = useState(() => dataUrlInicial(resultados));
  const [nombre, setNombre] = useState(resultados?.evidenciaNombre ?? "");
  const [url, setUrl] = useState(() => urlInicial(resultados));
  const [subiendo, setSubiendo] = useState(false);

  const limpiar = useCallback(() => {
    setDataUrl("");
    setNombre("");
    setUrl("");
  }, []);

  // Cambiar de tipo descarta lo cargado: un PDF no sirve como "imagen".
  const cambiarTipo = useCallback(
    (nuevo: TipoEvidencia | "") => {
      setTipo(nuevo);
      limpiar();
    },
    [limpiar]
  );

  const cargarArchivo = useCallback(async (file: File) => {
    if (file.size > MAX_EVIDENCIA_BYTES) {
      toast.error("El archivo es muy grande. Máximo 3MB.");
      return;
    }
    setSubiendo(true);
    try {
      const leido = file.type.startsWith("image/")
        ? await compressImageToDataUrl(file)
        : await fileToDataUrl(file);
      setDataUrl(leido);
      setNombre(file.name);
      toast.success(`Archivo "${file.name}" cargado.`);
    } catch {
      toast.error("No se pudo leer el archivo.");
    } finally {
      setSubiendo(false);
    }
  }, []);

  const reiniciar = useCallback((nuevos?: ResultadosHipotesis) => {
    setTipo(nuevos?.tipoEvidencia ?? "");
    setDataUrl(dataUrlInicial(nuevos));
    setNombre(nuevos?.evidenciaNombre ?? "");
    setUrl(urlInicial(nuevos));
  }, []);

  const incompleta = tipo !== "" && (tipo === "url" ? !url.trim() : !dataUrl);

  const evidencia = tipo === "url" ? url.trim() : dataUrl;

  return {
    tipo,
    cambiarTipo,
    dataUrl,
    nombre,
    url,
    setUrl,
    subiendo,
    cargarArchivo,
    limpiar,
    reiniciar,
    incompleta,
    valor: {
      evidencia: evidencia || undefined,
      evidenciaNombre: tipo !== "url" ? nombre || undefined : undefined,
      tipoEvidencia: (tipo as TipoEvidencia) || undefined,
    },
  };
}
