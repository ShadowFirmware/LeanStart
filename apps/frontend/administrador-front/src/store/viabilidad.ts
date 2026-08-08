import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, modoDemo } from "@leanstart/commons";

export interface NivelViabilidad {
  id: string;
  nombre: string;
  /** Límite superior inclusivo (0-100). El último nivel siempre termina en 100. */
  hasta: number;
  color: string;
}

const PALETA_NIVELES = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#9A62FA", "#EC4899", "#14B8A6", "#F97316"];

export interface NuevoNivel {
  nombre?: string;
  color?: string;
  /** Límite superior inclusivo (1-99). El último nivel siempre termina en 100. */
  hasta?: number;
}

interface ViabilidadStore {
  /** Peso (%) que aporta la evaluación al score final. El resto lo aporta la validación de hipótesis. */
  pesoEvaluacion: number;
  niveles: NivelViabilidad[];
  /** Calificación final mínima (0-100) para publicar un proyecto; por debajo, se devuelve al emprendedor. */
  umbralPublicacion: number;
  cargarViabilidad: () => Promise<void>;
  actualizarPesoEvaluacion: (peso: number) => Promise<void>;
  actualizarHastaNivel: (id: string, hasta: number) => Promise<void>;
  editarNivel: (id: string, data: { nombre: string; color: string }) => Promise<void>;
  actualizarUmbralPublicacion: (umbral: number) => Promise<void>;
  /**
   * Agrega un nivel. Con `datos.hasta` el nivel se inserta en la posición que
   * le corresponde según su límite superior; sin él se parte en dos el último
   * tramo (comportamiento histórico). Devuelve `false` si el tramo no cabe.
   */
  agregarNivel: (datos?: NuevoNivel) => Promise<boolean>;
  eliminarNivel: (id: string) => Promise<void>;
  reordenarNivel: (desde: number, hasta: number) => Promise<void>;
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

      async cargarViabilidad() {
        if (modoDemo()) return;
        const config = await apiFetch<{ pesoEvaluacion: number; umbralPublicacion: number; niveles: NivelViabilidad[] }>(
          "/viabilidad"
        );
        set({ pesoEvaluacion: config.pesoEvaluacion, umbralPublicacion: config.umbralPublicacion, niveles: config.niveles });
      },

      async actualizarPesoEvaluacion(peso) {
        const clamped = Math.max(0, Math.min(100, Math.round(peso)));
        if (!modoDemo()) {
          await apiFetch(`/viabilidad/peso-evaluacion`, { method: "PATCH", body: JSON.stringify({ peso: clamped }) });
        }
        set({ pesoEvaluacion: clamped });
      },

      async actualizarUmbralPublicacion(umbral) {
        const clamped = Math.max(0, Math.min(100, Math.round(umbral)));
        if (!modoDemo()) {
          await apiFetch(`/viabilidad/umbral-publicacion`, { method: "PATCH", body: JSON.stringify({ umbral: clamped }) });
        }
        set({ umbralPublicacion: clamped });
      },

      async actualizarHastaNivel(id, hasta) {
        if (!modoDemo()) {
          const niveles = await apiFetch<NivelViabilidad[]>(`/viabilidad/niveles/${id}/hasta`, {
            method: "PATCH",
            body: JSON.stringify({ hasta: Math.round(hasta) }),
          });
          set({ niveles });
          return;
        }

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

      async editarNivel(id, data) {
        if (!modoDemo()) {
          const niveles = await apiFetch<NivelViabilidad[]>(`/viabilidad/niveles/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
          });
          set({ niveles });
          return;
        }
        set({
          niveles: get().niveles.map((n) => (n.id === id ? { ...n, ...data } : n)),
        });
      },

      async agregarNivel(datos) {
        if (!modoDemo()) {
          const { creado, niveles } = await apiFetch<{ creado: boolean; niveles: NivelViabilidad[] }>("/viabilidad/niveles", {
            method: "POST",
            body: JSON.stringify(datos ?? {}),
            etiquetaCarga: "Agregando nivel",
          });
          set({ niveles });
          return creado;
        }

        const niveles = get().niveles;
        const nombre = datos?.nombre?.trim() || "Nuevo nivel";
        const color = datos?.color ?? PALETA_NIVELES[niveles.length % PALETA_NIVELES.length];

        let posicion: number;
        let hasta: number;

        if (datos?.hasta === undefined) {
          const lower = niveles.length >= 2 ? niveles[niveles.length - 2].hasta : 0;
          const upper = niveles[niveles.length - 1]?.hasta ?? 100;
          if (upper - lower < 2) return false;
          hasta = lower + Math.floor((upper - lower) / 2);
          posicion = Math.max(niveles.length - 1, 0);
        } else {
          hasta = Math.round(datos.hasta);
          posicion = niveles.filter((n) => n.hasta < hasta).length;
          const siguiente = niveles[posicion];
          // Sin un nivel por encima, o con ese límite ya ocupado, el tramo no cabe.
          if (!siguiente || siguiente.hasta <= hasta) return false;
        }

        const nuevo: NivelViabilidad = { id: crypto.randomUUID(), nombre, hasta, color };
        const copia = [...niveles];
        copia.splice(posicion, 0, nuevo);
        set({ niveles: copia });
        return true;
      },

      async eliminarNivel(id) {
        if (!modoDemo()) {
          const niveles = await apiFetch<NivelViabilidad[]>(`/viabilidad/niveles/${id}`, { method: "DELETE" });
          set({ niveles });
          return;
        }

        set((state) => {
          if (state.niveles.length <= 1) return state;
          const niveles = state.niveles.filter((n) => n.id !== id);
          niveles[niveles.length - 1] = { ...niveles[niveles.length - 1], hasta: 100 };
          return { niveles };
        });
      },

      async reordenarNivel(desde, hasta) {
        if (!modoDemo()) {
          const niveles = await apiFetch<NivelViabilidad[]>("/viabilidad/niveles/reordenar", {
            method: "POST",
            body: JSON.stringify({ desde, hasta }),
          });
          set({ niveles });
          return;
        }

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
    { name: "leanstart-viabilidad", skipHydration: true }
  )
);
