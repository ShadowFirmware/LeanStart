import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, modoDemo } from "@leanstart/commons";

export type EstadoReporte = "nuevo" | "atendido";

export interface ReporteSoporte {
  id: string;
  autorNombre: string;
  autorCorreo: string;
  autorRoles: string[];
  asunto: string;
  mensaje: string;
  navegador?: string;
  estado: EstadoReporte;
  creadoEn: string;
}

function fecha(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function mapReporte(r: Record<string, unknown>): ReporteSoporte {
  return {
    id: r.id as string,
    autorNombre: r.autorNombre as string,
    autorCorreo: r.autorCorreo as string,
    autorRoles: (r.autorRoles as string[]) ?? [],
    asunto: r.asunto as string,
    mensaje: r.mensaje as string,
    navegador: (r.navegador as string) ?? undefined,
    estado: r.estado as EstadoReporte,
    creadoEn: fecha(r.createdAt as string),
  };
}

interface SoporteStore {
  reportes: ReporteSoporte[];
  cargarReportes: () => Promise<void>;
  cambiarEstado: (id: string, estado: EstadoReporte) => Promise<void>;
}

export const useSoporteStore = create<SoporteStore>()(
  persist(
    (set, get) => ({
      reportes: [],

      async cargarReportes() {
        if (modoDemo()) return;
        const { items } = await apiFetch<{ items: Record<string, unknown>[] }>("/soporte/reportes");
        set({ reportes: items.map(mapReporte) });
      },

      async cambiarEstado(id, estado) {
        const previos = get().reportes;
        // Optimista: marcar "atendido" es la acción que el admin repite decenas de
        // veces seguidas y esperar el round-trip en cada una se siente roto. Si la
        // API falla se restaura la lista tal cual estaba.
        set({ reportes: previos.map((r) => (r.id === id ? { ...r, estado } : r)) });
        try {
          if (!modoDemo()) await apiFetch(`/soporte/reportes/${id}`, { method: "PATCH", body: JSON.stringify({ estado }) });
        } catch (err) {
          set({ reportes: previos });
          throw err;
        }
      },
    }),
    { name: "leanstart-soporte", skipHydration: true }
  )
);
