import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch, modoDemo } from "@leanstart/commons";

export type ServicioBitacora = "auth" | "empresas" | "evaluaciones";

export interface EntradaBitacora {
  id: string;
  actorNombre: string;
  actorCorreo: string;
  servicio: ServicioBitacora;
  accion: string;
  entidadTipo?: string;
  entidadDescripcion?: string;
  detalle?: string;
  creadaEn: string;
}

function fecha(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function mapEntrada(e: Record<string, unknown>): EntradaBitacora {
  const actor = (e.actor as Record<string, unknown>) ?? {};
  return {
    id: e.id as string,
    actorNombre: (actor.nombre as string) ?? "—",
    actorCorreo: (actor.correo as string) ?? "",
    servicio: e.servicio as ServicioBitacora,
    accion: e.accion as string,
    entidadTipo: (e.entidadTipo as string) ?? undefined,
    entidadDescripcion: (e.entidadDescripcion as string) ?? undefined,
    detalle: (e.detalle as string) ?? undefined,
    creadaEn: fecha(e.createdAt as string),
  };
}

interface BitacoraStore {
  entradas: EntradaBitacora[];
  cargarBitacora: () => Promise<void>;
}

export const useBitacoraStore = create<BitacoraStore>()(
  persist(
    (set) => ({
      entradas: [],

      async cargarBitacora() {
        if (modoDemo()) return;
        const { items } = await apiFetch<{ items: Record<string, unknown>[]; total: number }>(
          "/bitacora?pageSize=200"
        );
        set({ entradas: items.map(mapEntrada) });
      },
    }),
    { name: "leanstart-bitacora", skipHydration: true }
  )
);
