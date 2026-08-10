import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createIndexedDbStorage } from "../lib/indexed-db-storage";
import { apiFetch, modoDemo } from "../lib/api-client";

/**
 * Datos editables del perfil del propio usuario. En modo demo se guardan
 * localmente indexados por id de usuario; en modo real se sincronizan con
 * `PATCH /auth/me` del backend (el `userId` se ignora ahí — el gateway ya
 * sabe quién eres por el JWT — pero se conserva el parámetro para que el
 * mismo shape sirva en ambos modos).
 */
export interface PerfilData {
  nombre?: string;
  correo?: string;
  /** Avatar en data URL (comprimido) o vacío para usar la inicial. */
  avatarUrl?: string;
}

interface PerfilStore {
  /** Overrides por id de usuario. */
  perfiles: Record<string, PerfilData>;
  actualizarPerfil: (userId: string, data: PerfilData) => Promise<void>;
  cargarPerfil: (userId: string) => Promise<void>;
}

export const usePerfilStore = create<PerfilStore>()(
  persist(
    (set, get) => ({
      perfiles: {},
      /**
       * Trae el perfil real desde el backend y sobreescribe el override local.
       * Sin esto, un cambio de nombre/avatar hecho en OTRO dispositivo nunca se
       * refleja aquí (el override es puramente local, solo se escribe al editar).
       */
      async cargarPerfil(userId) {
        if (modoDemo()) return;
        const usuario = await apiFetch<{ nombre: string; email: string; avatarUrl?: string }>("/auth/me");
        set({
          perfiles: {
            ...get().perfiles,
            [userId]: { nombre: usuario.nombre, correo: usuario.email, avatarUrl: usuario.avatarUrl },
          },
        });
      },
      async actualizarPerfil(userId, data) {
        if (!modoDemo()) {
          const usuario = await apiFetch<{ nombre: string; email: string; avatarUrl?: string }>("/auth/me", {
            method: "PATCH",
            body: JSON.stringify(data),
          });
          set({
            perfiles: {
              ...get().perfiles,
              [userId]: { nombre: usuario.nombre, correo: usuario.email, avatarUrl: usuario.avatarUrl },
            },
          });
          return;
        }

        set({
          perfiles: {
            ...get().perfiles,
            [userId]: { ...get().perfiles[userId], ...data },
          },
        });
      },
    }),
    {
      name: "leanstart-perfil",
      skipHydration: true,
      storage: createJSONStorage(() => createIndexedDbStorage()),
    }
  )
);
