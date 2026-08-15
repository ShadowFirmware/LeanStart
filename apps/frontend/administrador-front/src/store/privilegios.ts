import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, modoDemo } from "@leanstart/commons";
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
  /** Trae la matriz real de un rol desde el backend (no-op en modo demo). */
  cargarPrivilegios: (rolId: string) => Promise<void>;
  toggleAccion: (rolId: string, modulo: Modulo, accion: Accion) => Promise<void>;
  toggleModuloCompleto: (rolId: string, modulo: Modulo) => Promise<void>;
  /** Activa/desactiva una acción en TODOS los módulos a la vez (toggle por columna). */
  toggleAccionColumna: (rolId: string, accion: Accion) => Promise<void>;
  /** Otorga o revoca TODOS los permisos del rol de una sola vez. */
  setTodos: (rolId: string, activar: boolean) => Promise<void>;
  /** Roles personalizados: solo existen en modo demo (el backend no los soporta todavía). */
  inicializarRol: (rolId: string) => void;
  eliminarRol: (rolId: string) => void;

  /** Privilegios EFECTIVOS de un usuario puntual: unión de sus roles + sus
   *  excepciones (`usuario_privilegios`). Clave = id del usuario. */
  privilegiosUsuario: MatrizPrivilegios;
  /** Trae los privilegios efectivos reales de un usuario (no-op en modo demo). */
  cargarPrivilegiosUsuario: (userId: string) => Promise<void>;
  /** Solo modo demo: siembra la matriz de un usuario si todavía no tiene una, sin pisar ediciones ya hechas en esta sesión. */
  inicializarPrivilegiosUsuario: (userId: string, base: MatrizRol) => void;
  /** Guarda en bloque el borrador armado en la matriz: cada celda trae su estado FINAL deseado. */
  setCeldasUsuario: (userId: string, cambios: Array<{ modulo: Modulo; accion: Accion; activar: boolean }>) => Promise<void>;
}

function matriz(base: Partial<Record<Modulo, Accion[]>>): MatrizRol {
  const result = {} as MatrizRol;
  for (const modulo of MODULOS) {
    result[modulo] = base[modulo] ?? [];
  }
  return result;
}

/** Convierte el array `[{modulo, acciones}]` que devuelve el backend a la matriz `{modulo: acciones[]}`. */
function mapMatriz(privilegiosApi: { modulo: Modulo; acciones: Accion[] }[]): MatrizRol {
  return matriz(Object.fromEntries(privilegiosApi.map((p) => [p.modulo, p.acciones])));
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

      async cargarPrivilegios(rolId) {
        if (modoDemo()) return;
        const respuesta = await apiFetch<{ modulo: Modulo; acciones: Accion[] }[]>(`/privilegios/${rolId}`);
        set((state) => ({ privilegios: { ...state.privilegios, [rolId]: mapMatriz(respuesta) } }));
      },

      async toggleAccion(rolId, modulo, accion) {
        if (!modoDemo()) {
          const respuesta = await apiFetch<{ modulo: Modulo; acciones: Accion[] }[]>(
            `/privilegios/${rolId}/toggle-accion`,
            { method: "PATCH", body: JSON.stringify({ modulo, accion }) }
          );
          set((state) => ({ privilegios: { ...state.privilegios, [rolId]: mapMatriz(respuesta) } }));
          return;
        }

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

      async toggleModuloCompleto(rolId, modulo) {
        if (!modoDemo()) {
          const respuesta = await apiFetch<{ modulo: Modulo; acciones: Accion[] }[]>(
            `/privilegios/${rolId}/toggle-modulo`,
            { method: "PATCH", body: JSON.stringify({ modulo }) }
          );
          set((state) => ({ privilegios: { ...state.privilegios, [rolId]: mapMatriz(respuesta) } }));
          return;
        }

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

      async toggleAccionColumna(rolId, accion) {
        if (!modoDemo()) {
          const respuesta = await apiFetch<{ modulo: Modulo; acciones: Accion[] }[]>(
            `/privilegios/${rolId}/toggle-columna`,
            { method: "PATCH", body: JSON.stringify({ accion }) }
          );
          set((state) => ({ privilegios: { ...state.privilegios, [rolId]: mapMatriz(respuesta) } }));
          return;
        }

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

      async setTodos(rolId, activar) {
        if (!modoDemo()) {
          const respuesta = await apiFetch<{ modulo: Modulo; acciones: Accion[] }[]>(
            `/privilegios/${rolId}/set-todos`,
            { method: "PATCH", body: JSON.stringify({ activar }) }
          );
          set((state) => ({ privilegios: { ...state.privilegios, [rolId]: mapMatriz(respuesta) } }));
          return;
        }

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

      privilegiosUsuario: {},

      async cargarPrivilegiosUsuario(userId) {
        if (modoDemo()) return;
        const respuesta = await apiFetch<{ modulo: Modulo; acciones: Accion[] }[]>(`/privilegios/usuario/${userId}`);
        set((state) => ({ privilegiosUsuario: { ...state.privilegiosUsuario, [userId]: mapMatriz(respuesta) } }));
      },

      inicializarPrivilegiosUsuario(userId, base) {
        if (get().privilegiosUsuario[userId]) return;
        set((state) => ({ privilegiosUsuario: { ...state.privilegiosUsuario, [userId]: base } }));
      },

      async setCeldasUsuario(userId, cambios) {
        if (!modoDemo()) {
          const respuesta = await apiFetch<{ modulo: Modulo; acciones: Accion[] }[]>(
            `/privilegios/usuario/${userId}/set-celdas`,
            { method: "PATCH", body: JSON.stringify({ cambios }) }
          );
          set((state) => ({ privilegiosUsuario: { ...state.privilegiosUsuario, [userId]: mapMatriz(respuesta) } }));
          return;
        }

        set((state) => {
          const actual = state.privilegiosUsuario[userId] ?? matriz({});
          const nueva = { ...actual };
          for (const c of cambios) {
            const lista = nueva[c.modulo] ?? [];
            nueva[c.modulo] = c.activar
              ? lista.includes(c.accion) ? lista : [...lista, c.accion]
              : lista.filter((a) => a !== c.accion);
          }
          return { privilegiosUsuario: { ...state.privilegiosUsuario, [userId]: nueva } };
        });
      },
    }),
    { name: "leanstart-privilegios", skipHydration: true }
  )
);
