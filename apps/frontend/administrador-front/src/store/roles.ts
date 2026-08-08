import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@leanstart/commons";

export interface RolPersonalizado {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
}

const PALETA_PERSONALIZADOS = ["#EC4899", "#14B8A6", "#F97316", "#6366F1", "#EF4444", "#84CC16"];

interface RolesStore {
  descripciones: Record<Role, string>;
  personalizados: RolPersonalizado[];
  actualizarDescripcion: (rol: Role, descripcion: string) => void;
  agregarRol: (data: { nombre: string; descripcion: string }) => string;
  editarRolPersonalizado: (id: string, data: { nombre: string; descripcion: string }) => void;
  eliminarRolPersonalizado: (id: string) => void;
}

const DESCRIPCIONES_DEFAULT: Record<Role, string> = {
  administrador: "Gestiona usuarios, roles, privilegios, criterios de evaluación y asignaciones dentro de la plataforma.",
  emprendedor: "Crea empresas, registra productos y construye su Lean Canvas para validar su modelo de negocio.",
  mentor: "Revisa las propuestas de los emprendedores y deja comentarios u observaciones sobre su avance.",
  evaluador: "Puntúa las ideas y modelos de negocio con base en una rúbrica de criterios configurable.",
};

export const useRolesStore = create<RolesStore>()(
  persist(
    (set, get) => ({
      descripciones: DESCRIPCIONES_DEFAULT,
      personalizados: [],

      actualizarDescripcion(rol, descripcion) {
        set({ descripciones: { ...get().descripciones, [rol]: descripcion } });
      },

      agregarRol(data) {
        const id = crypto.randomUUID();
        const color = PALETA_PERSONALIZADOS[get().personalizados.length % PALETA_PERSONALIZADOS.length];
        const nuevo: RolPersonalizado = { id, ...data, color };
        set({ personalizados: [...get().personalizados, nuevo] });
        return id;
      },

      editarRolPersonalizado(id, data) {
        set({
          personalizados: get().personalizados.map((r) => (r.id === id ? { ...r, ...data } : r)),
        });
      },

      eliminarRolPersonalizado(id) {
        set({ personalizados: get().personalizados.filter((r) => r.id !== id) });
      },
    }),
    { name: "leanstart-roles", skipHydration: true }
  )
);
