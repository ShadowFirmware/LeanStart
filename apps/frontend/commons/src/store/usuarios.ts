import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "../types";

export type EstadoUsuario = "activo" | "inactivo";

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Role;
  estado: EstadoUsuario;
  creadoEn: string;
}

interface UsuariosStore {
  usuarios: Usuario[];
  crearUsuario: (data: { nombre: string; correo: string; rol: Role }) => void;
  editarUsuario: (id: string, data: { nombre: string; correo: string; rol: Role }) => void;
  activarUsuario: (id: string) => void;
  desactivarUsuario: (id: string) => void;
}

const SEED_USUARIOS: Usuario[] = [
  { id: "seed-1", nombre: "Admin Principal", correo: "admin@leanstart.com", rol: "administrador", estado: "activo", creadoEn: "1 ene 2026" },
  { id: "seed-2", nombre: "Juan Pérez", correo: "juan@gmail.com", rol: "emprendedor", estado: "activo", creadoEn: "3 ene 2026" },
  { id: "seed-3", nombre: "Carlos Ruiz", correo: "mentor@gmail.com", rol: "mentor", estado: "activo", creadoEn: "5 ene 2026" },
  { id: "seed-4", nombre: "Ana López", correo: "evaluador@gmail.com", rol: "evaluador", estado: "inactivo", creadoEn: "8 ene 2026" },
  { id: "seed-5", nombre: "María Fernández", correo: "maria@gmail.com", rol: "emprendedor", estado: "activo", creadoEn: "12 ene 2026" },
];

export const useUsuariosStore = create<UsuariosStore>()(
  persist(
    (set, get) => ({
      usuarios: SEED_USUARIOS,

      crearUsuario(data) {
        const id = crypto.randomUUID();
        const ahora = new Date().toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const nuevo: Usuario = { id, ...data, estado: "activo", creadoEn: ahora };
        set({ usuarios: [nuevo, ...get().usuarios] });
      },

      editarUsuario(id, data) {
        set({
          usuarios: get().usuarios.map((u) => (u.id === id ? { ...u, ...data } : u)),
        });
      },

      activarUsuario(id) {
        set({
          usuarios: get().usuarios.map((u) => (u.id === id ? { ...u, estado: "activo" } : u)),
        });
      },

      desactivarUsuario(id) {
        set({
          usuarios: get().usuarios.map((u) => (u.id === id ? { ...u, estado: "inactivo" } : u)),
        });
      },
    }),
    { name: "leanstart-usuarios", skipHydration: true }
  )
);
