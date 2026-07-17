import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, modoDemo } from "@leanstart/commons";

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

/** Resultado de POST /evaluaciones/:id/finalizar — ya calculado y aplicado en el servidor. */
export interface ResultadoFinalizar {
  scoreEvaluacion: number;
  scoreHipotesis: number;
  scoreFinal: number;
  nivel: { id: string; nombre: string; hasta: number; color: string } | null;
  accionResultante: "publicado" | "devuelto";
}

interface EvaluacionesStore {
  evaluaciones: Record<string, EvaluacionEmpresa>;
  getEvaluacion: (empresaId: string) => EvaluacionEmpresa;
  cargarEvaluacion: (empresaId: string) => Promise<void>;
  setPuntaje: (empresaId: string, criterioId: string, puntaje: number) => Promise<void>;
  setComentarioCriterio: (empresaId: string, criterioId: string, comentario: string) => Promise<void>;
  setComentario: (empresaId: string, comentario: string) => Promise<void>;
  /** Solo modo real: calcula el score en el servidor, transiciona la empresa y notifica al emprendedor. */
  finalizar: (empresaId: string) => Promise<ResultadoFinalizar>;
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

      async cargarEvaluacion(empresaId) {
        if (modoDemo()) return;
        const evaluacion = await apiFetch<EvaluacionEmpresa>(`/evaluaciones/${empresaId}`);
        set((state) => ({ evaluaciones: { ...state.evaluaciones, [empresaId]: evaluacion } }));
      },

      async setPuntaje(empresaId, criterioId, puntaje) {
        const clamped = Math.max(0, Math.min(100, Math.round(puntaje)));
        if (!modoDemo()) {
          await apiFetch(`/evaluaciones/${empresaId}/puntaje`, {
            method: "PATCH",
            body: JSON.stringify({ criterioId, puntaje: clamped }),
          });
        }
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

      async setComentarioCriterio(empresaId, criterioId, comentario) {
        if (!modoDemo()) {
          await apiFetch(`/evaluaciones/${empresaId}/comentario-criterio`, {
            method: "PATCH",
            body: JSON.stringify({ criterioId, comentario }),
          });
        }
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

      async setComentario(empresaId, comentario) {
        if (!modoDemo()) {
          await apiFetch(`/evaluaciones/${empresaId}/comentario`, {
            method: "PATCH",
            body: JSON.stringify({ comentario }),
          });
        }
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

      async finalizar(empresaId) {
        return apiFetch<ResultadoFinalizar>(`/evaluaciones/${empresaId}/finalizar`, { method: "POST" });
      },
    }),
    { name: "leanstart-evaluaciones", skipHydration: true }
  )
);
