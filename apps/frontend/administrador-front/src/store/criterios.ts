import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Criterio {
  id: string;
  nombre: string;
  descripcion: string;
  peso: number;
}

interface CriteriosStore {
  criterios: Criterio[];
  agregarCriterio: (data: { nombre: string; descripcion: string; peso: number }) => void;
  editarCriterio: (id: string, data: { nombre: string; descripcion: string; peso: number }) => void;
  actualizarPeso: (id: string, peso: number) => void;
  eliminarCriterio: (id: string) => void;
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

      agregarCriterio(data) {
        const id = crypto.randomUUID();
        set({ criterios: [...get().criterios, { id, ...data }] });
      },

      editarCriterio(id, data) {
        set({
          criterios: get().criterios.map((c) => (c.id === id ? { ...c, ...data } : c)),
        });
      },

      actualizarPeso(id, peso) {
        set({
          criterios: get().criterios.map((c) => (c.id === id ? { ...c, peso } : c)),
        });
      },

      eliminarCriterio(id) {
        set({ criterios: get().criterios.filter((c) => c.id !== id) });
      },
    }),
    { name: "leanstart-criterios" }
  )
);
