import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, modoDemo } from "@leanstart/commons";

export interface Criterio {
  id: string;
  nombre: string;
  descripcion: string;
  peso: number;
}

interface CriteriosStore {
  criterios: Criterio[];
  cargarCriterios: () => Promise<void>;
  agregarCriterio: (data: { nombre: string; descripcion: string; peso: number }) => Promise<void>;
  editarCriterio: (id: string, data: { nombre: string; descripcion: string; peso: number }) => Promise<void>;
  actualizarPeso: (id: string, peso: number) => Promise<void>;
  eliminarCriterio: (id: string) => Promise<void>;
}

const CRITERIOS_DEFAULT: Criterio[] = [
  { id: "seed-1", nombre: "Problema y solución", descripcion: "Claridad del problema identificado y qué tan bien la solución propuesta lo resuelve.", peso: 25 },
  { id: "seed-2", nombre: "Propuesta de valor", descripcion: "Qué tan diferenciada y atractiva es la propuesta de valor frente a alternativas del mercado.", peso: 25 },
  { id: "seed-3", nombre: "Modelo de negocio y viabilidad financiera", descripcion: "Coherencia entre fuentes de ingreso, estructura de costos y mercado objetivo.", peso: 25 },
  { id: "seed-4", nombre: "Validación de hipótesis", descripcion: "Calidad de los experimentos diseñados y evidencia recabada para validar supuestos clave.", peso: 25 },
];

export const useCriteriosStore = create<CriteriosStore>()(
  persist(
    (set, get) => ({
      criterios: CRITERIOS_DEFAULT,

      async cargarCriterios() {
        if (modoDemo()) return;
        const criterios = await apiFetch<Criterio[]>("/criterios");
        set({ criterios });
      },

      async agregarCriterio(data) {
        if (!modoDemo()) {
          const criterio = await apiFetch<Criterio>("/criterios", { method: "POST", body: JSON.stringify(data) });
          set({ criterios: [...get().criterios, criterio] });
          return;
        }
        const id = crypto.randomUUID();
        set({ criterios: [...get().criterios, { id, ...data }] });
      },

      async editarCriterio(id, data) {
        if (!modoDemo()) {
          const criterio = await apiFetch<Criterio>(`/criterios/${id}`, { method: "PATCH", body: JSON.stringify(data) });
          set({ criterios: get().criterios.map((c) => (c.id === id ? criterio : c)) });
          return;
        }
        set({
          criterios: get().criterios.map((c) => (c.id === id ? { ...c, ...data } : c)),
        });
      },

      async actualizarPeso(id, peso) {
        if (!modoDemo()) {
          const criterio = await apiFetch<Criterio>(`/criterios/${id}/peso`, { method: "PATCH", body: JSON.stringify({ peso }) });
          set({ criterios: get().criterios.map((c) => (c.id === id ? criterio : c)) });
          return;
        }
        set({
          criterios: get().criterios.map((c) => (c.id === id ? { ...c, peso } : c)),
        });
      },

      async eliminarCriterio(id) {
        if (!modoDemo()) {
          await apiFetch(`/criterios/${id}`, { method: "DELETE" });
        }
        set({ criterios: get().criterios.filter((c) => c.id !== id) });
      },
    }),
    // skipHydration: la rehidratación inicial la dispara <LiveSync/> tras montar,
    // igual que el resto de stores. Sin esto el store se rehidrataba al importar
    // el módulo y el primer render de cliente no coincidía con el del servidor.
    { name: "leanstart-criterios", skipHydration: true }
  )
);
