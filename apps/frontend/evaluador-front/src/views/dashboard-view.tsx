"use client";

import Link from "next/link";
import { Building2, ClipboardList, CheckCircle2, ClipboardCheck } from "lucide-react";
import { useEmpresasStore } from "@leanstart/empresas-front";
import { useHasHydrated } from "@leanstart/commons";
import type { EstadoEmpresa, GiroEmpresa } from "@leanstart/commons";

const ESTADO_CONFIG: Record<EstadoEmpresa, { label: string; color: string; bg: string }> = {
  borrador: { label: "Borrador", color: "var(--brand)", bg: "var(--brand-tint)" },
  pendiente_mentoria: { label: "Pendiente de mentoría", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  en_mentoria: { label: "En mentoría", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  observaciones_pendientes: { label: "Observaciones pendientes", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  observaciones_atendidas: { label: "Obs. atendidas", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  pendiente_evaluacion: { label: "Pendiente de evaluación", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  en_evaluacion: { label: "En evaluación", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  publicado: { label: "Publicado", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  devuelto: { label: "Devuelto", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

const GIRO_LABELS: Record<GiroEmpresa, string> = {
  tecnologia: "Tecnología",
  educacion: "Educación",
  salud: "Salud",
  sustentabilidad: "Sustentabilidad",
  alimentacion: "Alimentación",
  comercio: "Comercio",
  servicios: "Servicios",
};

/** Estado en el que un proyecto espera la evaluación formal del evaluador. */
const ESTADO_PENDIENTE: EstadoEmpresa = "en_evaluacion";
/** Estados en los que el proyecto ya recibió una resolución del evaluador. */
const ESTADOS_REALIZADOS: EstadoEmpresa[] = ["publicado", "devuelto"];

export function EvaluadorDashboardView() {
  const hydrated = useHasHydrated();
  const empresasRaw = useEmpresasStore((s) => s.empresas);
  const empresas = hydrated ? empresasRaw : [];

  const asignados = empresas.filter((e) => e.evaluadorId);
  const pendientes = asignados.filter((e) => e.estado === ESTADO_PENDIENTE);
  const realizadas = asignados.filter((e) => ESTADOS_REALIZADOS.includes(e.estado));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Resumen de los proyectos que tienes asignados para evaluación.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Proyectos asignados", value: asignados.length, icon: Building2 },
          { label: "Evaluaciones pendientes", value: pendientes.length, icon: ClipboardList },
          { label: "Evaluaciones realizadas", value: realizadas.length, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl p-5 flex items-center gap-4"
            style={{
              backgroundColor: "var(--surface-profile)",
              boxShadow: "var(--shadow-card)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "rgba(154,98,250,0.10)",
                border: "1px solid rgba(154,98,250,0.15)",
              }}
            >
              <Icon className="w-5 h-5" style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-dim)" }}>
                {label}
              </p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-strong)" }}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pendientes de evaluación */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--text-dim)" }}
        >
          Pendientes de evaluación
        </p>

        {pendientes.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{
              backgroundColor: "var(--surface-profile)",
              boxShadow: "var(--shadow-card)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <ClipboardCheck className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              No tienes proyectos pendientes de evaluación por ahora.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendientes.slice(0, 5).map((empresa) => {
              const estadoConfig = ESTADO_CONFIG[empresa.estado];
              return (
                <Link
                  key={empresa.id}
                  href={`/evaluador/empresas/${empresa.id}`}
                  className="flex items-start gap-4 rounded-xl px-5 py-4 transition-[border-color]"
                  style={{
                    backgroundColor: "var(--surface-profile)",
                    boxShadow: "var(--shadow-card)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(154,98,250,0.25)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)")}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
                    style={{
                      backgroundColor: "var(--brand-tint)",
                      color: "var(--brand)",
                    }}
                  >
                    {empresa.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>
                          {empresa.nombre}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                          {GIRO_LABELS[empresa.giro]}
                        </p>
                      </div>
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                        style={{
                          color: estadoConfig.color,
                          backgroundColor: estadoConfig.bg,
                        }}
                      >
                        {estadoConfig.label}
                      </span>
                    </div>
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
