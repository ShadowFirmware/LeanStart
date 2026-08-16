"use client";

import { useState } from "react";
import { History, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Spinner, useAccion, apiFetch, modoDemo } from "@leanstart/commons";
import type { CanvasData } from "../store/empresas";

interface CanvasVersionApi {
  id: string;
  createdAt: string;
  canvasBloques: number;
  problema: string[];
  solucion: string;
  pvp: string;
  ventajaInjusta: string;
  segmentosClientes: string[];
  metricasClave: string[];
  canales: string[];
  estructuraCostos: string[];
  fuentesIngresos: string[];
}

const BLOQUES: { key: keyof CanvasData; label: string; tipo: "single" | "multi" }[] = [
  { key: "problema", label: "Problema", tipo: "multi" },
  { key: "solucion", label: "Solución", tipo: "single" },
  { key: "pvp", label: "Propuesta de valor única", tipo: "single" },
  { key: "ventajaInjusta", label: "Ventaja injusta", tipo: "single" },
  { key: "segmentosClientes", label: "Segmentos de clientes", tipo: "multi" },
  { key: "metricasClave", label: "Métricas clave", tipo: "multi" },
  { key: "canales", label: "Canales", tipo: "multi" },
  { key: "estructuraCostos", label: "Estructura de costos", tipo: "multi" },
  { key: "fuentesIngresos", label: "Fuentes de ingresos", tipo: "multi" },
];

const CANVAS_VACIO: CanvasData = {
  problema: [], solucion: "", pvp: "", ventajaInjusta: "",
  segmentosClientes: [], metricasClave: [], canales: [],
  estructuraCostos: [], fuentesIngresos: [],
};

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function versionAData(v: CanvasVersionApi): CanvasData {
  return {
    problema: v.problema, solucion: v.solucion, pvp: v.pvp, ventajaInjusta: v.ventajaInjusta,
    segmentosClientes: v.segmentosClientes, metricasClave: v.metricasClave, canales: v.canales,
    estructuraCostos: v.estructuraCostos, fuentesIngresos: v.fuentesIngresos,
  };
}

/** Diff de una lista: qué se agregó y qué se quitó respecto a la versión elegida. */
function diffLista(anterior: string[], actual: string[]): { agregados: string[]; quitados: string[] } {
  return {
    agregados: actual.filter((v) => !anterior.includes(v)),
    quitados: anterior.filter((v) => !actual.includes(v)),
  };
}

function BloqueDiff({ label, tipo, valorAnterior, valorActual }: {
  label: string; tipo: "single" | "multi"; valorAnterior: string | string[]; valorActual: string | string[];
}) {
  if (tipo === "single") {
    const antes = (valorAnterior as string).trim();
    const ahora = (valorActual as string).trim();
    if (antes === ahora) return null;
    return (
      <div className="flex flex-col gap-1.5 pb-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <p className="text-xs font-semibold" style={{ color: "var(--text-strong)" }}>{label}</p>
        {antes && <p className="text-[13px] leading-relaxed" style={{ color: "#EF4444", textDecoration: "line-through" }}>{antes}</p>}
        {ahora && <p className="text-[13px] leading-relaxed" style={{ color: "#10B981" }}>{ahora}</p>}
        {!antes && !ahora && <p className="text-[13px]" style={{ color: "var(--text-faint)" }}>Sin cambios de contenido.</p>}
      </div>
    );
  }
  const { agregados, quitados } = diffLista(valorAnterior as string[], valorActual as string[]);
  if (agregados.length === 0 && quitados.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5 pb-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <p className="text-xs font-semibold" style={{ color: "var(--text-strong)" }}>{label}</p>
      {quitados.map((item, i) => (
        <p key={`q-${i}`} className="text-[13px] leading-relaxed" style={{ color: "#EF4444", textDecoration: "line-through" }}>− {item}</p>
      ))}
      {agregados.map((item, i) => (
        <p key={`a-${i}`} className="text-[13px] leading-relaxed" style={{ color: "#10B981" }}>+ {item}</p>
      ))}
    </div>
  );
}

interface HistorialCanvasButtonProps {
  empresaId: string;
}

export function HistorialCanvasButton({ empresaId }: HistorialCanvasButtonProps) {
  const [abierto, setAbierto] = useState(false);
  const [versiones, setVersiones] = useState<CanvasVersionApi[]>([]);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const carga = useAccion();

  async function abrir() {
    setAbierto(true);
    if (modoDemo()) return;
    await carga.ejecutar(
      async () => {
        const data = await apiFetch<CanvasVersionApi[]>(`/empresas/${empresaId}/canvas/historial`);
        setVersiones(data);
        setSeleccionada(data[0]?.id ?? null);
      },
      { onError: () => toast.error("No se pudo cargar el historial.") }
    );
  }

  const indiceSeleccionado = versiones.findIndex((v) => v.id === seleccionada);
  const version = versiones[indiceSeleccionado];
  // La versión anterior EN EL TIEMPO a la seleccionada (la próxima en el array,
  // que viene ordenado de más reciente a más antigua) — no el estado actual del
  // canvas, que sigue cambiando con cada guardado nuevo. Así el diff de una
  // versión queda fijo: muestra solo lo que cambió en ESE guardado puntual, y
  // guardar algo después no le mueve el diff a las versiones ya pasadas.
  const versionAnterior = indiceSeleccionado >= 0 ? versiones[indiceSeleccionado + 1] : undefined;
  const datosAnteriores = versionAnterior ? versionAData(versionAnterior) : CANVAS_VACIO;

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
        style={{ color: "var(--text-dim)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
      >
        <History className="w-3.5 h-3.5" /> Historial
      </button>

      {abierto && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setAbierto(false); }}
        >
          <div style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-hair)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 780, maxHeight: "80vh", display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" style={{ color: "var(--brand)" }} />
                <p style={{ color: "var(--text-strong)", fontWeight: 700, fontSize: 14 }}>Historial del Lean Canvas</p>
              </div>
              <button
                onClick={() => setAbierto(false)}
                style={{ color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            {modoDemo() ? (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>El historial no está disponible en modo demo.</p>
            ) : carga.cargando ? (
              <div className="flex items-center justify-center py-10"><Spinner /></div>
            ) : versiones.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>Todavía no hay versiones guardadas — se crea una cada vez que guardas un cambio en el canvas.</p>
            ) : (
              <div className="flex gap-4 overflow-hidden" style={{ flex: 1, minHeight: 0 }}>
                <div className="flex flex-col gap-1 overflow-y-auto pr-1" style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--border-subtle)" }}>
                  {versiones.map((v, i) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSeleccionada(v.id)}
                      className="text-left px-2.5 py-2 rounded-lg text-xs transition-colors"
                      style={{
                        backgroundColor: seleccionada === v.id ? "rgba(154,98,250,0.14)" : "transparent",
                        color: seleccionada === v.id ? "var(--brand-accent)" : "var(--text-dim)",
                      }}
                    >
                      <p className="font-medium">{i === 0 ? "Más reciente" : formatFecha(v.createdAt)}</p>
                      {i === 0 && <p style={{ color: "var(--text-faint)", marginTop: 2 }}>{formatFecha(v.createdAt)}</p>}
                      <p style={{ color: "var(--text-faint)", marginTop: 2 }}>{v.canvasBloques} de 9 bloques</p>
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                  <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>
                    {versionAnterior
                      ? "Cambios de este guardado respecto al anterior."
                      : "Primer guardado — todo el contenido es nuevo."}{" "}
                    En <span style={{ color: "#EF4444" }}>rojo</span> lo que había, en <span style={{ color: "#10B981" }}>verde</span> lo que quedó.
                  </p>
                  {version && BLOQUES.every((b) => {
                    const anterior = datosAnteriores[b.key];
                    const actual = versionAData(version)[b.key];
                    if (b.tipo === "single") return (anterior as string).trim() === (actual as string).trim();
                    return diffLista(anterior as string[], actual as string[]).agregados.length === 0
                      && diffLista(anterior as string[], actual as string[]).quitados.length === 0;
                  }) ? (
                    <p className="text-sm" style={{ color: "var(--text-faint)" }}>Este guardado no cambió nada.</p>
                  ) : (
                    version && BLOQUES.map((b) => (
                      <BloqueDiff
                        key={b.key}
                        label={b.label}
                        tipo={b.tipo}
                        valorAnterior={datosAnteriores[b.key]}
                        valorActual={versionAData(version)[b.key]}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setAbierto(false)}
                className="h-9 px-4 text-[13px] rounded-[10px]"
                style={{ backgroundColor: "var(--border-subtle)", border: "1px solid var(--border-hair)", color: "var(--text-strong)" }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
