import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Modulo, Accion } from "@leanstart/commons";

export const MODULOS: Modulo[] = [
  "usuarios", "empresas", "productos", "lean_canvas",
  "hipotesis", "mentorias", "evaluaciones", "reportes",
];

export const ACCIONES: Accion[] = ["ver", "crear", "editar", "eliminar", "aprobar", "exportar"];

type MatrizRol = Record<Modulo, Accion[]>;
/** Clave = id del rol (los 4 roles del sistema usan su nombre literal como id; los roles personalizados usan un uuid). */
type MatrizPrivilegios = Record<string, MatrizRol>;

interface PrivilegiosStore {
  privilegios: MatrizPrivilegios;
  tienePrivilegio: (rolId: string, modulo: Modulo, accion: Accion) => boolean;
  toggleAccion: (rolId: string, modulo: Modulo, accion: Accion) => void;
  toggleModuloCompleto: (rolId: string, modulo: Modulo) => void;
  /** Activa/desactiva una acción en TODOS los módulos a la vez (toggle por columna). */
  toggleAccionColumna: (rolId: string, accion: Accion) => void;
  /** Otorga o revoca TODOS los permisos del rol de una sola vez. */
  setTodos: (rolId: string, activar: boolean) => void;
  inicializarRol: (rolId: string) => void;
  eliminarRol: (rolId: string) => void;
}

function matriz(base: Partial<Record<Modulo, Accion[]>>): MatrizRol {
  const result = {} as MatrizRol;
  for (const modulo of MODULOS) {
    result[modulo] = base[modulo] ?? [];
  }
  return result;
}

const PRIVILEGIOS_DEFAULT: MatrizPrivilegios = {
  administrador: matriz({
    usuarios: ["ver", "crear", "editar"],
    empresas: ["ver"],
    productos: ["ver"],
    lean_canvas: ["ver"],
    hipotesis: ["ver"],
    mentorias: ["ver", "editar"],
    evaluaciones: ["ver", "editar"],
    reportes: ["ver", "exportar"],
  }),
  emprendedor: matriz({
    empresas: ["ver", "crear", "editar", "eliminar"],
    productos: ["ver", "crear", "editar", "eliminar"],
    lean_canvas: ["ver", "editar"],
    hipotesis: ["ver", "crear", "editar", "eliminar"],
    mentorias: ["ver"],
    evaluaciones: ["ver"],
    reportes: ["ver"],
  }),
  mentor: matriz({
    empresas: ["ver"],
    productos: ["ver"],
    lean_canvas: ["ver"],
    hipotesis: ["ver", "editar", "aprobar"],
    mentorias: ["ver", "crear", "editar", "aprobar"],
    reportes: ["ver"],
  }),
  evaluador: matriz({
    empresas: ["ver"],
    productos: ["ver"],
    lean_canvas: ["ver"],
    hipotesis: ["ver"],
    evaluaciones: ["ver", "crear", "editar", "aprobar"],
    reportes: ["ver"],
  }),
};

export const usePrivilegiosStore = create<PrivilegiosStore>()(
  persist(
    (set, get) => ({
      privilegios: PRIVILEGIOS_DEFAULT,

      tienePrivilegio(rolId, modulo, accion) {
        return get().privilegios[rolId]?.[modulo].includes(accion) ?? false;
      },

      toggleAccion(rolId, modulo, accion) {
        set((state) => {
          const actual = state.privilegios[rolId]?.[modulo] ?? [];
          const actualizado = actual.includes(accion)
            ? actual.filter((a) => a !== accion)
            : [...actual, accion];
          return {
            privilegios: {
              ...state.privilegios,
              [rolId]: { ...(state.privilegios[rolId] ?? matriz({})), [modulo]: actualizado },
            },
          };
        });
      },

      toggleModuloCompleto(rolId, modulo) {
        set((state) => {
          const actual = state.privilegios[rolId]?.[modulo] ?? [];
          const actualizado = actual.length === ACCIONES.length ? [] : [...ACCIONES];
          return {
            privilegios: {
              ...state.privilegios,
              [rolId]: { ...(state.privilegios[rolId] ?? matriz({})), [modulo]: actualizado },
            },
          };
        });
      },

      toggleAccionColumna(rolId, accion) {
        set((state) => {
          const rolMatriz = state.privilegios[rolId] ?? matriz({});
          const todosLaTienen = MODULOS.every((m) => (rolMatriz[m] ?? []).includes(accion));
          const nuevaMatriz = {} as MatrizRol;
          for (const m of MODULOS) {
            const actual = rolMatriz[m] ?? [];
            nuevaMatriz[m] = todosLaTienen
              ? actual.filter((a) => a !== accion)
              : actual.includes(accion) ? actual : [...actual, accion];
          }
          return { privilegios: { ...state.privilegios, [rolId]: nuevaMatriz } };
        });
      },

      setTodos(rolId, activar) {
        set((state) => ({
          privilegios: {
            ...state.privilegios,
            [rolId]: matriz(
              activar
                ? MODULOS.reduce((acc, m) => ({ ...acc, [m]: [...ACCIONES] }), {})
                : {}
            ),
          },
        }));
      },

      inicializarRol(rolId) {
        if (get().privilegios[rolId]) return;
        set((state) => ({ privilegios: { ...state.privilegios, [rolId]: matriz({}) } }));
      },

      eliminarRol(rolId) {
        set((state) => {
          const { [rolId]: _eliminado, ...resto } = state.privilegios;
          return { privilegios: resto };
        });
      },
    }),
    { name: "leanstart-privilegios", skipHydration: true }
  )
);
