"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Devuelve `false` en el render del servidor y en el primer render del cliente,
 * y `true` una vez hidratado. Sirve para evitar mismatches de hidratación con
 * stores persistidos (zustand-persist): renderiza un estado neutro hasta que
 * `hasHydrated` sea true, de modo que servidor y primer render de cliente
 * coincidan, y sólo después se muestren los valores rehidratados de localStorage.
 *
 * Usa `useSyncExternalStore` (server snapshot = false, client snapshot = true)
 * en vez de un `setState` en effect: es la forma canónica y sin cascadas de render.
 */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
