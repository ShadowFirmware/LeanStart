import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, modoDemo } from "@leanstart/commons";

export type TipoReporte = "boleta" | "canvas";

export interface ReporteGenerado {
  id: string;
  empresaId: string;
  empresaNombre: string;
  tipo: TipoReporte;
  /** Nombre de quien generó el reporte (administrador en sesión). */
  generadoPor: string;
  generadoEn: string;
}

interface ReportesGeneradosStore {
  reportes: ReporteGenerado[];
  cargarReportesGenerados: () => Promise<void>;
  registrarReporte: (data: {
    empresaId: string;
    empresaNombre: string;
    tipo: TipoReporte;
    generadoPor: string;
  }) => Promise<void>;
}

function fecha(iso?: string): string {
  return new Date(iso ?? Date.now()).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function mapReporte(r: Record<string, unknown>): ReporteGenerado {
  return {
    id: r.id as string,
    empresaId: r.empresaId as string,
    empresaNombre: r.empresaNombre as string,
    tipo: r.tipo as TipoReporte,
    generadoPor: (r.generadoPor as string) ?? "Administrador",
    generadoEn: fecha(r.generadoEn as string),
  };
}

export const useReportesGeneradosStore = create<ReportesGeneradosStore>()(
  persist(
    (set, get) => ({
      reportes: [],

      async cargarReportesGenerados() {
        if (modoDemo()) return;
        const reportes = await apiFetch<Record<string, unknown>[]>("/reportes-generados");
        set({ reportes: reportes.map(mapReporte) });
      },

      async registrarReporte(data) {
        if (!modoDemo()) {
          const reporte = await apiFetch<Record<string, unknown>>("/reportes-generados", {
            method: "POST",
            body: JSON.stringify(data),
          });
          set({ reportes: [mapReporte(reporte), ...get().reportes] });
          return;
        }

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
