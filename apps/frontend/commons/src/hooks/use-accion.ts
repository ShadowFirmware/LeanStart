"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { conCarga } from "../store/carga";

/**
 * Estado de carga para una acción del usuario (guardar, eliminar, publicar…).
 *
 * Devuelve `cargando` para pintar el spinner del botón y `ejecutar` para
 * envolver la operación. Además de lo local, la anuncia en el registro global
 * de carga, así que el indicador del shell aparece aunque la vista no pinte
 * nada por su cuenta.
 *
 * · Ignora reentradas: mientras una ejecución está en vuelo, un segundo clic no
 *   dispara otra (evita crear el mismo registro dos veces).
 * · No actualiza estado tras desmontar: navegar mientras se guarda no rompe.
 * · Devuelve `undefined` si la operación falla; el `onError` opcional recibe el
 *   error para mostrar el toast correspondiente.
 */
export function useAccion(): {
  cargando: boolean;
  ejecutar: <T>(
    operacion: () => Promise<T> | T,
    opciones?: { etiqueta?: string; onError?: (error: unknown) => void }
  ) => Promise<T | undefined>;
} {
  const [cargando, setCargando] = useState(false);
  const enVuelo = useRef(false);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const ejecutar = useCallback(
    async <T,>(
      operacion: () => Promise<T> | T,
      opciones?: { etiqueta?: string; onError?: (error: unknown) => void }
    ): Promise<T | undefined> => {
      if (enVuelo.current) return undefined;
      enVuelo.current = true;
      setCargando(true);
      try {
        return await conCarga(operacion, opciones?.etiqueta);
      } catch (error) {
        opciones?.onError?.(error);
        return undefined;
      } finally {
        enVuelo.current = false;
        if (montado.current) setCargando(false);
      }
    },
    []
  );

  return { cargando, ejecutar };
}
