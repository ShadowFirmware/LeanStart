import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Evaluación que el administrador/evaluador captura para una empresa. */
export interface EvaluacionEmpresa {
  /** Puntaje 0-100 por cada criterio (clave = id del criterio). */
  criterios: Record<string, number>;
  /** Comentario particular por criterio (clave = id del criterio). */
  comentariosCriterios: Record<string, string>;
  /** Comentario general del evaluador (se incluye en el reporte del Lean Canvas). */
  comentarioEvaluador: string;
  actualizadoEn?: string;
}

interface EvaluacionesStore {
  evaluaciones: Record<string, EvaluacionEmpresa>;
  getEvaluacion: (empresaId: string) => EvaluacionEmpresa;
  setPuntaje: (empresaId: string, criterioId: string, puntaje: number) => void;
  setComentarioCriterio: (empresaId: string, criterioId: string, comentario: string) => void;
  setComentario: (empresaId: string, comentario: string) => void;
}

const VACIA: EvaluacionEmpresa = { criterios: {}, comentariosCriterios: {}, comentarioEvaluador: "" };

function fecha(): string {
  return new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export const useEvaluacionesStore = create<EvaluacionesStore>()(
  persist(
    (set, get) => ({
      evaluaciones: {},

      getEvaluacion(empresaId) {
        return get().evaluaciones[empresaId] ?? VACIA;
      },

      setPuntaje(empresaId, criterioId, puntaje) {
        const clamped = Math.max(0, Math.min(100, Math.round(puntaje)));
        set((state) => {
          const actual = state.evaluaciones[empresaId] ?? VACIA;
          return {
            evaluaciones: {
              ...state.evaluaciones,
              [empresaId]: {
                ...actual,
                criterios: { ...actual.criterios, [criterioId]: clamped },
                actualizadoEn: fecha(),
              },
            },
          };
        });
      },

      setComentarioCriterio(empresaId, criterioId, comentario) {
        set((state) => {
          const actual = state.evaluaciones[empresaId] ?? VACIA;
          return {
            evaluaciones: {
              ...state.evaluaciones,
              [empresaId]: {
                ...actual,
                comentariosCriterios: { ...actual.comentariosCriterios, [criterioId]: comentario },
                actualizadoEn: fecha(),
              },
            },
          };
        });
      },

      setComentario(empresaId, comentario) {
        set((state) => {
          const actual = state.evaluaciones[empresaId] ?? VACIA;
          return {
            evaluaciones: {
              ...state.evaluaciones,
              [empresaId]: { ...actual, comentarioEvaluador: comentario, actualizadoEn: fecha() },
            },
          };
        });
      },
    }),
    { name: "leanstart-evaluaciones", skipHydration: true }
  )
);
