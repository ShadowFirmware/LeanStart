"use client";

import {
  Users, Building2, GraduationCap, ClipboardCheck,
  UserCog, Star, FileEdit, Activity, LayoutGrid, Rocket, UsersRound, UserPlus,
} from "lucide-react";
import { useUsuariosStore, useHasHydrated } from "@leanstart/commons";
import { useEmpresasStore } from "@leanstart/empresas-front";

// "pendiente_mentoria"/"pendiente_evaluacion" NO cuentan como "en mentoría"/"en evaluación"
// — todavía no tienen mentor/evaluador asignado, están esperando esa asignación. Antes se
// mezclaban en el mismo conteo, así que un proyecto sin asignar aparecía como "en curso".
const ESTADOS_MENTORIA = ["en_mentoria", "observaciones_pendientes", "observaciones_atendidas"];
const ESTADOS_EVALUACION = ["en_evaluacion"];
const ESTADOS_PENDIENTES_ASIGNACION = ["pendiente_mentoria", "pendiente_evaluacion"];

type StatKey =
  | "usuariosRegistrados" | "empresasRegistradas"
  | "proyectosEnMentoria" | "proyectosEnEvaluacion" | "empresasEnBorrador" | "proyectosPendientesAsignacion"
  | "mentoresActivos" | "evaluadoresActivos" | "empresariosActivos";

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function SectionCard({ title, icon: Icon, color, meta, children }: {
  title: string;
  icon: React.ElementType;
  color: string;
  meta?: string;
  children: React.ReactNode;
}) {
  const rgb = hexToRgb(color);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-subtle)" }}
    >
      <div
        className="flex items-center justify-between gap-3 px-5 md:px-6 py-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.2)` }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>{title}</span>
        </div>
        {meta && <span className="text-xs" style={{ color: "var(--text-faint)" }}>{meta}</span>}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}

function StatItem({ label, value, icon: Icon, color, big }: {
  label: string; value: number; icon: React.ElementType; color: string; big?: boolean;
}) {
  const rgb = hexToRgb(color);
  return (
    <div className="flex items-center gap-4">
      <div
        className={`rounded-lg flex items-center justify-center shrink-0 ${big ? "w-12 h-12" : "w-10 h-10"}`}
        style={{ backgroundColor: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.2)` }}
      >
        <Icon className={big ? "w-6 h-6" : "w-5 h-5"} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium" style={{ color: "var(--text-dim)" }}>{label}</p>
        <p className={`font-bold mt-0.5 ${big ? "text-3xl" : "text-2xl"}`} style={{ color: "var(--text-strong)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

const PLATAFORMA: { key: StatKey; label: string; icon: React.ElementType }[] = [
  { key: "usuariosRegistrados", label: "Usuarios registrados", icon: Users },
  { key: "empresasRegistradas", label: "Empresas registradas", icon: Building2 },
];

const PROYECTOS: { key: StatKey; label: string; icon: React.ElementType; color: string }[] = [
  { key: "proyectosEnMentoria",         label: "En mentoría",             icon: GraduationCap,  color: "#3B82F6" },
  { key: "proyectosEnEvaluacion",       label: "En evaluación",           icon: ClipboardCheck, color: "#F59E0B" },
  { key: "proyectosPendientesAsignacion", label: "Pendientes de asignar", icon: UserPlus,       color: "#EF4444" },
  { key: "empresasEnBorrador",          label: "En borrador",             icon: FileEdit,       color: "#7E7C86" },
];

const EQUIPO: { key: StatKey; label: string; icon: React.ElementType }[] = [
  { key: "mentoresActivos",    label: "Mentores activos",    icon: UserCog },
  { key: "evaluadoresActivos", label: "Evaluadores activos", icon: Star },
  { key: "empresariosActivos", label: "Empresarios activos", icon: Activity },
];

export function AdminDashboardView() {
  const hydrated = useHasHydrated();
  const usuariosRaw = useUsuariosStore((s) => s.usuarios);
  const empresasRaw = useEmpresasStore((s) => s.empresas);
  const usuarios = hydrated ? usuariosRaw : [];
  const empresas = hydrated ? empresasRaw : [];

  const activosPorRol = (rol: string) => usuarios.filter((u) => u.rol === rol && u.estado === "activo").length;

  const stats: Record<StatKey, number> = {
    usuariosRegistrados: usuarios.length,
    empresasRegistradas: empresas.length,
    proyectosEnMentoria: empresas.filter((e) => ESTADOS_MENTORIA.includes(e.estado)).length,
    proyectosEnEvaluacion: empresas.filter((e) => ESTADOS_EVALUACION.includes(e.estado)).length,
    proyectosPendientesAsignacion: empresas.filter((e) => ESTADOS_PENDIENTES_ASIGNACION.includes(e.estado)).length,
    empresasEnBorrador: empresas.filter((e) => e.estado === "borrador").length,
    mentoresActivos: activosPorRol("mentor"),
    evaluadoresActivos: activosPorRol("evaluador"),
    empresariosActivos: activosPorRol("emprendedor"),
  };

  const totalProyectos =
    stats.proyectosEnMentoria + stats.proyectosEnEvaluacion + stats.proyectosPendientesAsignacion + stats.empresasEnBorrador;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>
          Dashboard Administrativo
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          Métricas generales de la plataforma.
        </p>
      </div>

      {/* Plataforma */}
      <SectionCard title="Plataforma" icon={LayoutGrid} color="#9A62FA">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PLATAFORMA.map(({ key, label, icon }) => (
            <StatItem key={key} label={label} value={stats[key]} icon={icon} color="#9A62FA" big />
          ))}
        </div>
      </SectionCard>

      {/* Proyectos en curso */}
      <SectionCard title="Proyectos en curso" icon={Rocket} color="#3B82F6" meta={`${totalProyectos} en total`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {PROYECTOS.map(({ key, label, icon, color }) => (
            <StatItem key={key} label={label} value={stats[key]} icon={icon} color={color} />
          ))}
        </div>
        {/* Barra de distribución */}
        {totalProyectos > 0 && (
          <div className="mt-5 h-1.5 rounded-full overflow-hidden flex" style={{ backgroundColor: "var(--border-subtle)" }}>
            {PROYECTOS.map(({ key, color }) => (
              <div
                key={key}
                style={{
                  width: `${(stats[key] / totalProyectos) * 100}%`,
                  backgroundColor: color,
                }}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Equipo activo */}
      <SectionCard title="Equipo activo" icon={UsersRound} color="#10B981">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {EQUIPO.map(({ key, label, icon }) => (
            <StatItem key={key} label={label} value={stats[key]} icon={icon} color="#10B981" />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
