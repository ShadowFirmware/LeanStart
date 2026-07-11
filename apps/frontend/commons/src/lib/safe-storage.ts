import type { StateStorage } from "zustand/middleware";

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    // Nombres/códigos de QuotaExceededError según navegador.
    (e.name === "QuotaExceededError" ||
      e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      e.code === 22 ||
      e.code === 1014)
  );
}

/**
 * StateStorage sobre localStorage que NO tumba la app si se llena la cuota.
 * Cuando `setItem` lanza QuotaExceededError se invoca `onQuotaExceeded` (para
 * avisar al usuario) y el estado en memoria sigue vivo, solo no se persiste.
 * Es seguro en SSR: si no hay `window`, es un no-op.
 */
export function createSafeLocalStorage(
  onQuotaExceeded?: (name: string) => void
): StateStorage {
  return {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(name);
    },
    setItem: (name, value) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(name, value);
      } catch (e) {
        if (isQuotaError(e)) {
          onQuotaExceeded?.(name);
          return;
        }
        throw e;
      }
    },
    removeItem: (name) => {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(name);
    },
  };
}
