import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NivelViabilidad {
  id: string;
  nombre: string;
  /** Límite superior inclusivo (0-100). El último nivel siempre termina en 100. */
  hasta: number;
  color: string;
}

const PALETA_NIVELES = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#9A62FA", "#EC4899", "#14B8A6", "#F97316"];

interface ViabilidadStore {
  /** Peso (%) que aporta la evaluación al score final. El resto lo aporta la validación de hipótesis. */
  pesoEvaluacion: number;
  niveles: NivelViabilidad[];
  /** Calificación final mínima (0-100) para publicar un proyecto; por debajo, se devuelve al emprendedor. */
  umbralPublicacion: number;
  actualizarPesoEvaluacion: (peso: number) => void;
  actualizarHastaNivel: (id: string, hasta: number) => void;
  editarNivel: (id: string, data: { nombre: string; color: string }) => void;
  actualizarUmbralPublicacion: (umbral: number) => void;
  agregarNivel: () => boolean;
  eliminarNivel: (id: string) => void;
  reordenarNivel: (desde: number, hasta: number) => void;
}

const NIVELES_DEFAULT: NivelViabilidad[] = [
  { id: "seed-baja", nombre: "Baja", hasta: 49, color: "#EF4444" },
  { id: "seed-media", nombre: "Media", hasta: 74, color: "#F59E0B" },
  { id: "seed-alta", nombre: "Alta", hasta: 100, color: "#10B981" },
];

export const useViabilidadStore = create<ViabilidadStore>()(
  persist(
    (set, get) => ({
      pesoEvaluacion: 80,
      niveles: NIVELES_DEFAULT,
      umbralPublicacion: 70,

      actualizarPesoEvaluacion(peso) {
        set({ pesoEvaluacion: Math.max(0, Math.min(100, Math.round(peso))) });
      },

      actualizarUmbralPublicacion(umbral) {
        set({ umbralPublicacion: Math.max(0, Math.min(100, Math.round(umbral))) });
      },

      actualizarHastaNivel(id, hasta) {
        set((state) => {
          const i = state.niveles.findIndex((n) => n.id === id);
          if (i === -1 || i === state.niveles.length - 1) return state;
          const lower = i === 0 ? 0 : state.niveles[i - 1].hasta;
          const upper = state.niveles[i + 1].hasta;
          const clamped = Math.max(lower + 1, Math.min(upper - 1, Math.round(hasta)));
          const niveles = state.niveles.map((n, idx) => (idx === i ? { ...n, hasta: clamped } : n));
          return { niveles };
        });
      },

      editarNivel(id, data) {
        set({
          niveles: get().niveles.map((n) => (n.id === id ? { ...n, ...data } : n)),
        });
      },

      agregarNivel() {
        const niveles = get().niveles;
        const lower = niveles.length >= 2 ? niveles[niveles.length - 2].hasta : 0;
        const upper = niveles[niveles.length - 1]?.hasta ?? 100;
        if (upper - lower < 2) return false;
        const mid = lower + Math.floor((upper - lower) / 2);
        const nuevo: NivelViabilidad = {
          id: crypto.randomUUID(),
          nombre: "Nuevo nivel",
          hasta: mid,
          color: PALETA_NIVELES[niveles.length % PALETA_NIVELES.length],
        };
        const copia = [...niveles];
        copia.splice(Math.max(niveles.length - 1, 0), 0, nuevo);
        set({ niveles: copia });
        return true;
      },

      eliminarNivel(id) {
        set((state) => {
          if (state.niveles.length <= 1) return state;
          const niveles = state.niveles.filter((n) => n.id !== id);
          niveles[niveles.length - 1] = { ...niveles[niveles.length - 1], hasta: 100 };
          return { niveles };
        });
      },

      reordenarNivel(desde, hasta) {
        set((state) => {
          const niveles = state.niveles;
          if (
            desde === hasta ||
            desde < 0 || hasta < 0 ||
            desde >= niveles.length || hasta >= niveles.length
          ) {
            return state;
          }

          // Ancho (en % del rango 0-100) que ocupa cada nivel, en el orden actual.
          const anchos = niveles.map((n, i) => {
            const min = i === 0 ? 0 : niveles[i - 1].hasta + 1;
            return n.hasta - min + 1;
          });

          const nivelesReordenados = [...niveles];
          const anchosReordenados = [...anchos];
          const [nivelMovido] = nivelesReordenados.splice(desde, 1);
          const [anchoMovido] = anchosReordenados.splice(desde, 1);
          nivelesReordenados.splice(hasta, 0, nivelMovido);
          anchosReordenados.splice(hasta, 0, anchoMovido);

          // Recalcula los límites superiores manteniendo el ancho original de cada nivel.
          let acumulado = 0;
          const nuevos = nivelesReordenados.map((n, i) => {
            acumulado += anchosReordenados[i];
            const esUltimo = i === nivelesReordenados.length - 1;
            return { ...n, hasta: esUltimo ? 100 : acumulado - 1 };
          });

          return { niveles: nuevos };
        });
      },
    }),
    { name: "leanstart-viabilidad" }
  )
);
