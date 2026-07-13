import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createSafeLocalStorage } from "../lib/safe-storage";

/**
 * Datos editables del perfil del propio usuario. Como LeanStart es solo-front
 * (sin backend), los cambios que hace un usuario sobre su cuenta se guardan
 * localmente indexados por su id (el de la sesión real o el id demo por rol).
 * Al conectar backend, esto se sustituye por un PATCH /me y el mismo shape sirve.
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
  actualizarPerfil: (userId: string, data: PerfilData) => void;
}

export const usePerfilStore = create<PerfilStore>()(
  persist(
    (set, get) => ({
      perfiles: {},
      actualizarPerfil(userId, data) {
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
      storage: createJSONStorage(() => createSafeLocalStorage()),
    }
  )
);
