import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TipoReporte = "boleta" | "canvas";

export interface ReporteGenerado {
  id: string;
  empresaId: string;
  empresaNombre: string;
  tipo: TipoReporte;
  generadoEn: string;
}

interface ReportesGeneradosStore {
  reportes: ReporteGenerado[];
  registrarReporte: (data: { empresaId: string; empresaNombre: string; tipo: TipoReporte }) => void;
}

function fecha(): string {
  return new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export const useReportesGeneradosStore = create<ReportesGeneradosStore>()(
  persist(
    (set, get) => ({
      reportes: [],

      registrarReporte(data) {
        const nuevo: ReporteGenerado = {
          id: crypto.randomUUID(),
          ...data,
          generadoEn: fecha(),
        };
        set({ reportes: [nuevo, ...get().reportes] });
      },
    }),
    { name: "leanstart-reportes-generados", skipHydration: true }
  )
);
