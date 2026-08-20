"use client";

import { useEffect, useState } from "react";
import { apiFetch, modoDemo } from "@leanstart/commons";
import type { Empresa } from "../store/empresas";

/**
 * Verificación en vivo (con debounce) de si un nombre de empresa ya está en
 * uso — el nombre es único en TODA la plataforma, no solo entre las propias
 * del usuario, así que hace falta preguntarle al backend (el store local solo
 * trae las que el usuario puede ver). En modo demo, sin backend real, se
 * compara solo contra `empresasPropias`.
 */
export function useNombreDuplicado(nombre: string, empresasPropias: Empresa[], excluirId?: string): boolean {
  const [duplicado, setDuplicado] = useState(false);

  useEffect(() => {
    const normalizado = nombre.trim();
    if (normalizado.length < 2) {
      setDuplicado(false);
      return;
    }

    let cancelado = false;
    const timeout = setTimeout(async () => {
      if (modoDemo()) {
        const existe = empresasPropias.some(
          (e) => e.id !== excluirId && e.nombre.trim().toLowerCase() === normalizado.toLowerCase()
        );
        if (!cancelado) setDuplicado(existe);
        return;
      }
      try {
        const query = new URLSearchParams({ nombre: normalizado });
        if (excluirId) query.set("excluirId", excluirId);
        const { disponible } = await apiFetch<{ disponible: boolean }>(
          `/empresas/nombre-disponible?${query.toString()}`,
          { etiquetaCarga: null }
        );
        if (!cancelado) setDuplicado(!disponible);
      } catch {
        // Si la verificación falla (red, etc.) no bloqueamos aquí — el backend
        // igual rechaza el duplicado al enviar el formulario.
      }
    }, 400);

    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [nombre, empresasPropias, excluirId]);

  return duplicado;
}
