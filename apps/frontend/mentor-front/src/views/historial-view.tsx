"use client";

import Link from "next/link";
import {
  MessageSquare, ClipboardList, CheckCircle2,
  LayoutTemplate, Package, Lightbulb, Building2,
} from "lucide-react";
import { useEmpresasStore, useObservacionesStore, type CanvasData, type Observacion } from "@leanstart/empresas-front";
import { useHasHydrated } from "@leanstart/commons";
import type { EstadoObservacion } from "@leanstart/commons";

const ESTADO_OBS_CONFIG: Record<EstadoObservacion, { label: string; color: string; bg: string }> = {
  borrador: { label: "Borrador", color: "var(--text-dim)", bg: "var(--border-hair)" },
  pendiente: { label: "Pendiente", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  en_revision: { label: "En revisión", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  atendida: { label: "Atendida", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  cerrada: { label: "Cerrada", color: "var(--text-dim)", bg: "var(--border-hair)" },
};

const MODULO_CONFIG: Record<Observacion["tipoElemento"], { label: string; icon: React.ElementType }> = {
  canvas: { label: "Lean Canvas", icon: LayoutTemplate },
  producto: { label: "Producto", icon: Package },
  hipotesis: { label: "Hipótesis", icon: Lightbulb },
  general: { label: "Comentario general", icon: Building2 },
};

const CANVAS_BLOCK_LABELS: Record<keyof CanvasData, string> = {
  problema: "Problema",
  solucion: "Solución",
  pvp: "Propuesta de valor única",
  ventajaInjusta: "Ventaja injusta",
  segmentosClientes: "Segmentos de clientes",
  metricasClave: "Métricas clave",
  canales: "Canales",
  estructuraCostos: "Estructura de costos",
  fuentesIngresos: "Fuentes de ingresos",
};

interface MentorHistorialViewProps {
  autorNombre?: string;
}

export function MentorHistorialView({ autorNombre = "Mentor Demo" }: MentorHistorialViewProps = {}) {
  const hydrated = useHasHydrated();
  const empresasRaw = useEmpresasStore((s) => s.empresas);
  const observacionesRaw = useObservacionesStore((s) => s.observaciones);
  const empresas = hydrated ? empresasRaw : [];
  const observaciones = hydrated ? observacionesRaw : [];

  const registros = observaciones
    .filter((o) => o.autorNombre === autorNombre)
    .map((o) => {
      const empresa = empresas.find((e) => e.id === o.empresaId);

      let elemento: string;
      if (o.tipoElemento === "canvas") {
        elemento = CANVAS_BLOCK_LABELS[o.elementoId as keyof CanvasData] ?? o.elementoId;
      } else if (o.tipoElemento === "general") {
        elemento = "Información principal";
      } else if (o.tipoElemento === "producto") {
        elemento = empresa?.productosList?.find((p) => p.id === o.elementoId)?.nombre ?? "Producto eliminado";
      } else {
        const indice = empresa?.hipotesisList?.findIndex((h) => h.id === o.elementoId) ?? -1;
        elemento = indice >= 0 ? `Hipótesis #${indice + 1}` : "Hipótesis eliminada";
      }

      return {
        id: o.id,
        empresaId: o.empresaId,
        fecha: o.creadaEn,
        empresaNombre: empresa?.nombre ?? "Empresa eliminada",
        modulo: o.tipoElemento,
        elemento,
        comentario: o.comentario,
        estado: o.estado,
      };
    });

  const total = registros.length;
  const atendidas = registros.filter((r) => r.estado === "atendida" || r.estado === "cerrada").length;
  const pendientes = total - atendidas;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>Historial de Mentorías</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Consulta todas las observaciones que has realizado anteriormente.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Observaciones realizadas", value: total, icon: MessageSquare },
          { label: "Pendientes de resolución", value: pendientes, icon: ClipboardList },
          { label: "Atendidas", value: atendidas, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl p-5 flex items-center gap-4"
            style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.15)" }}
            >
              <Icon className="w-5 h-5" style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-dim)" }}>{label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-strong)" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de observaciones */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-dim)" }}>
          Observaciones realizadas
        </p>

        {registros.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
          >
            <MessageSquare className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              Aún no has dejado observaciones. Cuando comentes en un proyecto, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {registros.map((r) => {
              const cfg = ESTADO_OBS_CONFIG[r.estado];
              const moduloCfg = MODULO_CONFIG[r.modulo];
              return (
                <Link
                  key={r.id}
                  href={`/mentor/empresas/${r.empresaId}`}
                  className="flex items-start gap-4 rounded-xl px-5 py-4 transition-[border-color]"
                  style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(154,98,250,0.25)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)")}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.16)" }}
                  >
                    <moduloCfg.icon className="w-4.5 h-4.5" style={{ color: "var(--brand)" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-strong)" }}>
                          {r.empresaNombre}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                          {moduloCfg.label} · {r.elemento}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ color: cfg.color, backgroundColor: cfg.bg }}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--text-faint)" }}>
                          {r.fecha}
                        </span>
                      </div>
                    </div>
                    <p
                      className="text-sm mt-2 leading-relaxed break-words"
                      style={{ color: "var(--muted-foreground)", overflowWrap: "anywhere" }}
                    >
                      {r.comentario}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
