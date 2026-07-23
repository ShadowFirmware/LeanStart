import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, modoDemo } from "../lib/api-client";
import type { Role } from "../types";

export type EstadoUsuario = "activo" | "inactivo";

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Role;
  estado: EstadoUsuario;
  creadoEn: string;
  /** Avatar en data URL (comprimido), el mismo que el usuario sube en "Mi Perfil". */
  avatarUrl?: string;
}

interface UsuariosStore {
  usuarios: Usuario[];
  cargarUsuarios: () => Promise<void>;
  crearUsuario: (data: { nombre: string; correo: string; rol: Role; password: string }) => Promise<void>;
  editarUsuario: (
    id: string,
    data: { nombre: string; correo: string; rol: Role; password?: string }
  ) => Promise<void>;
  activarUsuario: (id: string) => Promise<void>;
  desactivarUsuario: (id: string) => Promise<void>;
}

const SEED_USUARIOS: Usuario[] = [
  { id: "seed-1", nombre: "Admin Principal", correo: "admin@leanstart.com", rol: "administrador", estado: "activo", creadoEn: "1 ene 2026" },
  { id: "seed-2", nombre: "Juan Pérez", correo: "juan@gmail.com", rol: "emprendedor", estado: "activo", creadoEn: "3 ene 2026" },
  { id: "seed-3", nombre: "Carlos Ruiz", correo: "mentor@gmail.com", rol: "mentor", estado: "activo", creadoEn: "5 ene 2026" },
  { id: "seed-4", nombre: "Ana López", correo: "evaluador@gmail.com", rol: "evaluador", estado: "activo", creadoEn: "8 ene 2026" },
  { id: "seed-5", nombre: "María Fernández", correo: "maria@gmail.com", rol: "emprendedor", estado: "activo", creadoEn: "12 ene 2026" },
];

function mapUsuario(u: Record<string, unknown>): Usuario {
  return {
    id: u.id as string,
    nombre: u.nombre as string,
    correo: u.correo as string,
    rol: u.rol as Role,
    estado: u.estado as EstadoUsuario,
    avatarUrl: (u.avatarUrl as string) ?? undefined,
    creadoEn: new Date(u.createdAt as string).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

export const useUsuariosStore = create<UsuariosStore>()(
  persist(
    (set, get) => ({
      usuarios: SEED_USUARIOS,

      async cargarUsuarios() {
        if (modoDemo()) return;
        const usuarios = await apiFetch<Record<string, unknown>[]>("/usuarios");
        set({ usuarios: usuarios.map(mapUsuario) });
      },

      async crearUsuario(data) {
        if (!modoDemo()) {
          const usuario = await apiFetch<Record<string, unknown>>("/usuarios", {
            method: "POST",
            body: JSON.stringify(data),
          });
          set({ usuarios: [mapUsuario(usuario), ...get().usuarios] });
          return;
        }

        const { password: _password, ...resto } = data;
        const id = crypto.randomUUID();
        const ahora = new Date().toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const nuevo: Usuario = { id, ...resto, estado: "activo", creadoEn: ahora };
        set({ usuarios: [nuevo, ...get().usuarios] });
      },

      async editarUsuario(id, data) {
        if (!modoDemo()) {
          const usuario = await apiFetch<Record<string, unknown>>(`/usuarios/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
          });
          set({ usuarios: get().usuarios.map((u) => (u.id === id ? mapUsuario(usuario) : u)) });
          return;
        }

        const { password: _password, ...resto } = data;
        set({
          usuarios: get().usuarios.map((u) => (u.id === id ? { ...u, ...resto } : u)),
        });
      },

      async activarUsuario(id) {
        if (!modoDemo()) {
          const usuario = await apiFetch<Record<string, unknown>>(`/usuarios/${id}/activar`, { method: "PATCH" });
          set({ usuarios: get().usuarios.map((u) => (u.id === id ? mapUsuario(usuario) : u)) });
          return;
        }
        set({
          usuarios: get().usuarios.map((u) => (u.id === id ? { ...u, estado: "activo" } : u)),
        });
      },

      async desactivarUsuario(id) {
        if (!modoDemo()) {
          const usuario = await apiFetch<Record<string, unknown>>(`/usuarios/${id}/desactivar`, { method: "PATCH" });
          set({ usuarios: get().usuarios.map((u) => (u.id === id ? mapUsuario(usuario) : u)) });
          return;
        }
        set({
          usuarios: get().usuarios.map((u) => (u.id === id ? { ...u, estado: "inactivo" } : u)),
        });
      },
    }),
    { name: "leanstart-usuarios", skipHydration: true }
  )
);
