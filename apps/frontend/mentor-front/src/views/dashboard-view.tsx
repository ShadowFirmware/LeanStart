"use client";

import Link from "next/link";
import { Building2, ClipboardList, CheckCircle2, GraduationCap } from "lucide-react";
import { useEmpresasStore } from "@leanstart/empresas-front";
import { useHasHydrated } from "@leanstart/commons";
import type { EstadoEmpresa, GiroEmpresa } from "@leanstart/commons";

const ESTADO_CONFIG: Record<EstadoEmpresa, { label: string; color: string; bg: string }> = {
  borrador: { label: "Borrador", color: "#9A62FA", bg: "rgba(154,98,250,0.12)" },
  pendiente_mentoria: { label: "Pendiente de mentoría", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  en_mentoria: { label: "En mentoría", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  observaciones_pendientes: { label: "Observaciones pendientes", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  observaciones_atendidas: { label: "Obs. atendidas", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  pendiente_evaluacion: { label: "Pendiente de evaluación", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  en_evaluacion: { label: "En evaluación", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  evaluado: { label: "Evaluado", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
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

/** Estados en los que un proyecto sigue activo dentro del proceso de mentoría. */
const ESTADOS_EN_MENTORIA: EstadoEmpresa[] = ["en_mentoria", "observaciones_pendientes", "observaciones_atendidas"];
/** Estados en los que el proyecto espera una acción del mentor (primera revisión o re-revisión). */
const ESTADOS_REQUIEREN_ACCION: EstadoEmpresa[] = ["en_mentoria", "observaciones_atendidas"];

export function MentorDashboardView() {
  const hydrated = useHasHydrated();
  const empresasRaw = useEmpresasStore((s) => s.empresas);
  const empresas = hydrated ? empresasRaw : [];

  const asignados = empresas.filter((e) => e.mentorId);
  const enMentoria = asignados.filter((e) => ESTADOS_EN_MENTORIA.includes(e.estado));
  const pendientesRevision = asignados.filter((e) => ESTADOS_REQUIEREN_ACCION.includes(e.estado));
  const revisados = asignados.filter((e) => !ESTADOS_EN_MENTORIA.includes(e.estado));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F2F0F7" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
          Resumen de los proyectos que tienes en mentoría.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Proyectos asignados", value: asignados.length, icon: Building2 },
          { label: "Pendientes de revisión", value: pendientesRevision.length, icon: ClipboardList },
          { label: "Revisados", value: revisados.length, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl p-5 flex items-center gap-4"
            style={{
              backgroundColor: "#131219",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "rgba(154,98,250,0.10)",
                border: "1px solid rgba(154,98,250,0.15)",
              }}
            >
              <Icon className="w-5 h-5" style={{ color: "#9A62FA" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#7E7C86" }}>
                {label}
              </p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: "#F2F0F7" }}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pendientes de revisión */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "#7E7C86" }}
        >
          Pendientes de revisión
        </p>

        {pendientesRevision.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{
              backgroundColor: "#131219",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <GraduationCap className="w-8 h-8 mx-auto mb-3" style={{ color: "#7E7C86" }} />
            <p className="text-sm" style={{ color: "#7E7C86" }}>
              No tienes proyectos pendientes de revisión por ahora.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendientesRevision.slice(0, 5).map((empresa) => {
              const estadoConfig = ESTADO_CONFIG[empresa.estado];
              return (
                <Link
                  key={empresa.id}
                  href={`/mentor/empresas/${empresa.id}`}
                  className="flex items-start gap-4 rounded-xl px-5 py-4 transition-[border-color]"
                  style={{
                    backgroundColor: "#131219",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(154,98,250,0.25)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)")}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
                    style={{
                      backgroundColor: "rgba(154,98,250,0.12)",
                      color: "#9A62FA",
                    }}
                  >
                    {empresa.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#F2F0F7" }}>
                          {empresa.nombre}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#7E7C86" }}>
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
