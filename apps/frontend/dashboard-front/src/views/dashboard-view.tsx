"use client";

import { Building2, ClipboardCheck, TrendingUp, Plus, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button, useCurrentUser, useHasHydrated } from "@leanstart/commons";
import type { EstadoEmpresa, GiroEmpresa } from "@leanstart/commons";
import { useEmpresasStore } from "@leanstart/empresas-front";

const ESTADO_CONFIG: Record<EstadoEmpresa, { label: string; color: string; bg: string }> = {
  borrador: { label: "Borrador", color: "var(--brand)", bg: "var(--brand-tint)" },
  pendiente_mentoria: { label: "Pendiente de mentoría", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  en_mentoria: { label: "En mentoría", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  observaciones_pendientes: { label: "Obs. pendientes", color: "#F97316", bg: "rgba(249,115,22,0.12)" },
  observaciones_atendidas: { label: "Obs. atendidas", color: "#14B8A6", bg: "rgba(20,184,166,0.12)" },
  pendiente_evaluacion: { label: "Pendiente de evaluación", color: "#EAB308", bg: "rgba(234,179,8,0.12)" },
  en_evaluacion: { label: "En evaluación", color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
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

import type { Progreso } from "@leanstart/empresas-front";

const REQUISITOS = [
  { key: "tieneProducto" as keyof Progreso, label: "Producto" },
  { key: "tieneCanvas" as keyof Progreso, label: "Canvas" },
  { key: "tieneHipotesis" as keyof Progreso, label: "Hipótesis" },
];

function ProgressoBorrador({ progreso }: { progreso: Progreso }) {
  const completados = REQUISITOS.filter((r) => progreso[r.key]).length;
  const total = REQUISITOS.length;
  const pct = Math.round((completados / total) * 100);

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: "var(--text-dim)" }}>
          {completados} de {total} requisitos para enviar
        </span>
        <span className="text-xs font-medium" style={{ color: pct === 100 ? "#10B981" : "var(--text-dim)" }}>
          {pct}%
        </span>
      </div>
      <div
        className="w-full h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--border-hair)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: pct === 100 ? "#10B981" : "var(--brand)",
          }}
        />
      </div>
      <div className="flex items-center gap-4 mt-2.5">
        {REQUISITOS.map(({ key, label }) => {
          const done = progreso[key];
          return (
            <div key={key} className="flex items-center gap-1">
              {done ? (
                <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: "#10B981" }} />
              ) : (
                <Circle className="w-3 h-3 shrink-0" style={{ color: "var(--text-faint)" }} />
              )}
              <span className="text-[11px]" style={{ color: done ? "var(--text-strong)" : "var(--text-faint)" }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardView() {
  const hydrated = useHasHydrated();
  const currentUser = useCurrentUser();
  const todasLasEmpresas = useEmpresasStore((s) => s.empresas);
  // Sólo las empresas del emprendedor actual, y neutro hasta rehidratar.
  const empresas = hydrated
    ? todasLasEmpresas.filter((e) => e.ownerId === currentUser?.id)
    : [];
  const recientes = empresas.slice(0, 3);

  const evaluadas = empresas.filter((e) => e.estado === "publicado" || e.estado === "devuelto");
  const scoresPromediables = evaluadas
    .map((e) => e.scoreFinal)
    .filter((s): s is number => typeof s === "number");
  const scorePromedio =
    scoresPromediables.length > 0
      ? Math.round(scoresPromediables.reduce((acc, s) => acc + s, 0) / scoresPromediables.length)
      : 0;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Resumen general de tus proyectos y actividad reciente.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Empresas creadas", value: empresas.length, suffix: "", icon: Building2 },
          { label: "Evaluaciones recibidas", value: evaluadas.length, suffix: "", icon: ClipboardCheck },
          { label: "Score promedio", value: scorePromedio, suffix: "/100", icon: TrendingUp },
        ].map(({ label, value, suffix, icon: Icon }) => (
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
                <span className="text-sm font-normal" style={{ color: "var(--text-dim)" }}>
                  {suffix}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empresas recientes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-dim)" }}
          >
            Empresas recientes
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/emprendedor/empresas"
              className="text-xs transition-colors"
              style={{ color: "var(--brand)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "var(--brand-accent)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "var(--brand)")
              }
            >
              Ver todas
            </Link>
            <Button
              size="sm"
              nativeButton={false}
              className="h-7 px-3 text-xs font-medium border-0"
              style={{
                background: "var(--brand-gradient)",
                color: "var(--brand-fg)",
              }}
              render={<Link href="/emprendedor/empresas/nueva" />}
            >
              <Plus className="w-3 h-3" />
              Crear empresa
            </Button>
          </div>
        </div>

        {recientes.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{
              backgroundColor: "var(--surface-profile)",
              boxShadow: "var(--shadow-card)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Building2 className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              Aún no tienes empresas registradas.{" "}
              <Link href="/emprendedor/empresas/nueva" style={{ color: "var(--brand)" }}>
                Crea una ahora
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recientes.map((empresa) => {
              const estadoConfig = ESTADO_CONFIG[empresa.estado];
              return (
                <Link
                  key={empresa.id}
                  href={`/emprendedor/empresas/${empresa.id}`}
                  className="flex items-start gap-4 rounded-xl px-5 py-4 transition-[border-color]"
                  style={{
                    backgroundColor: "var(--surface-profile)",
                    boxShadow: "var(--shadow-card)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor =
                      "rgba(154,98,250,0.25)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.borderColor =
                      "var(--border-subtle)")
                  }
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 overflow-hidden"
                    style={{
                      backgroundColor: "var(--brand-tint)",
                      color: "var(--brand)",
                    }}
                  >
                    {empresa.logoUrl ? (
                      <Image src={empresa.logoUrl} alt={empresa.nombre} width={36} height={36} className="object-contain w-full h-full p-1" unoptimized />
                    ) : (
                      empresa.nombre.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>
                          {empresa.nombre}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                          {GIRO_LABELS[empresa.giro]} · {empresa.creadaEn}
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
                    {empresa.estado === "borrador" && empresa.progreso && (
                      <ProgressoBorrador progreso={empresa.progreso} />
                    )}
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
