import type { StateStorage } from "zustand/middleware";

const DB_NAME = "leanstart-store";
const OBJECT_STORE = "kv";
const DB_VERSION = 1;

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

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(OBJECT_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(OBJECT_STORE, mode);
      const req = run(tx.objectStore(OBJECT_STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

/**
 * StateStorage sobre IndexedDB para zustand-persist. Reemplaza a localStorage
 * (tope real de ~5-10MB, insuficiente para evidencias/imágenes embebidas en
 * base64 — ver MAX_EVIDENCIA_BYTES) por una cuota ligada al espacio en disco
 * disponible (típicamente cientos de MB o más).
 *
 * Migra en caliente: si un `name` no existe todavía en IndexedDB pero sí en
 * localStorage (dato de una versión anterior de la app), lo copia y limpia
 * la entrada vieja, sin que el usuario pierda nada.
 *
 * Sigue sin tumbar la app si por lo que sea se llega a topar una cuota: se
 * avisa vía `onQuotaExceeded` y el estado en memoria continúa igual, solo
 * no se persiste ese cambio.
 */
export function createIndexedDbStorage(onQuotaExceeded?: (name: string) => void): StateStorage {
  return {
    getItem: async (name) => {
      if (typeof indexedDB === "undefined") return null;
      try {
        const value = await withStore<string | undefined>("readonly", (store) => store.get(name));
        if (typeof value === "string") return value;
      } catch {
        // Sigue al fallback de localStorage / null de abajo.
      }

      if (typeof window === "undefined") return null;
      const legacy = window.localStorage.getItem(name);
      if (legacy == null) return null;

      try {
        await withStore("readwrite", (store) => store.put(legacy, name));
        window.localStorage.removeItem(name);
      } catch {
        // No se pudo migrar todavía; se sigue sirviendo desde localStorage mientras tanto.
      }
      return legacy;
    },
    setItem: async (name, value) => {
      if (typeof indexedDB === "undefined") return;
      try {
        await withStore("readwrite", (store) => store.put(value, name));
      } catch (e) {
        if (isQuotaError(e)) {
          onQuotaExceeded?.(name);
          return;
        }
        throw e;
      }
    },
    removeItem: async (name) => {
      if (typeof indexedDB === "undefined") return;
      await withStore("readwrite", (store) => store.delete(name));
    },
  };
}
