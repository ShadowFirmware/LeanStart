import { create } from "zustand";
import { apiFetch, modoDemo } from "@leanstart/commons";

export interface ReporteEmpresa {
  id: string;
  empresaId: string;
  autorNombre: string;
  motivo: string;
  creadaEn: string;
}

interface ReportesEmpresaStore {
  reportes: ReporteEmpresa[];
  reportarEmpresa: (empresaId: string, autorNombre: string, motivo: string) => Promise<void>;
}

function mapReporte(r: Record<string, unknown>): ReporteEmpresa {
  return {
    id: r.id as string,
    empresaId: r.empresaId as string,
    autorNombre: r.autorNombre as string,
    motivo: r.motivo as string,
    creadaEn: new Date(r.createdAt as string).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

/** Reportar una empresa (mentor/evaluador viendo un proyecto que no es el propio). */
export const useReportesEmpresaStore = create<ReportesEmpresaStore>()((set, get) => ({
  reportes: [],

  async reportarEmpresa(empresaId, autorNombre, motivo) {
    if (modoDemo()) {
      const id = crypto.randomUUID();
      const ahora = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
      set({ reportes: [{ id, empresaId, autorNombre, motivo, creadaEn: ahora }, ...get().reportes] });
      return;
    }

    const creado = await apiFetch<Record<string, unknown>>(`/empresas/${empresaId}/reportes`, {
      method: "POST",
      body: JSON.stringify({ motivo, autorNombre }),
    });
    set({ reportes: [mapReporte(creado), ...get().reportes] });
  },
}));
