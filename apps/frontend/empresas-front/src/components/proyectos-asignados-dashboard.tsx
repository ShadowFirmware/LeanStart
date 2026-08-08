"use client";

import Link from "next/link";
import { Building2, ClipboardList, CheckCircle2 } from "lucide-react";
import { useHasHydrated, ViewSkeleton, GIRO_LABELS, ESTADO_EMPRESA_CONFIG, EmpresaLogo } from "@leanstart/commons";
import { useEmpresasStore, type Empresa } from "../store/empresas";

interface ProyectosAsignadosDashboardProps {
  /** Bajada del encabezado ("Resumen de los proyectos que tienes en mentoría."). */
  descripcion: string;
  /** Ruta base de las tarjetas: `${basePath}/${empresa.id}`. */
  basePath: string;
  /** Campo por el que se sabe si el proyecto es de este usuario. */
  campoAsignado: "mentorId" | "evaluadorId";
  /** Proyectos que esperan una acción del usuario (los que se listan abajo). */
  esPendiente: (empresa: Empresa) => boolean;
  /** Proyectos en los que el usuario ya se pronunció. */
  esResuelto: (empresa: Empresa) => boolean;
  /** Textos de la segunda y tercera tarjeta de conteo. */
  etiquetaPendientes: string;
  etiquetaResueltos: string;
  /** Encabezado y vacío de la lista de pendientes. */
  tituloPendientes: string;
  textoVacio: string;
  iconoVacio: React.ElementType;
}

/**
 * Tablero de "proyectos que tengo asignados": conteos arriba y los pendientes
 * abajo.
 *
 * Lo comparten el mentor y el evaluador, que tenían la misma vista duplicada
 * palabra por palabra: solo cambiaban las etiquetas, la ruta de las tarjetas y
 * qué estados cuentan como pendiente o resuelto. Eso es justo lo que se pasa
 * por props.
 */
export function ProyectosAsignadosDashboard({
  descripcion,
  basePath,
  campoAsignado,
  esPendiente,
  esResuelto,
  etiquetaPendientes,
  etiquetaResueltos,
  tituloPendientes,
  textoVacio,
  iconoVacio: IconoVacio,
}: ProyectosAsignadosDashboardProps) {
  const hydrated = useHasHydrated();
  const empresasRaw = useEmpresasStore((s) => s.empresas);
  const empresas = hydrated ? empresasRaw : [];

  const asignados = empresas.filter((e) => e[campoAsignado]);
  const pendientes = asignados.filter(esPendiente);
  const resueltos = asignados.filter(esResuelto);

  // Esqueleto en vez de un tablero con todos los contadores en cero mientras
  // el store persistido termina de rehidratar.
  if (!hydrated) return <ViewSkeleton variante="tarjetas" ancho="max-w-5xl" />;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
          {descripcion}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Proyectos asignados", value: asignados.length, icon: Building2 },
          { label: etiquetaPendientes, value: pendientes.length, icon: ClipboardList },
          { label: etiquetaResueltos, value: resueltos.length, icon: CheckCircle2 },
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

      {/* Lista de pendientes */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--text-dim)" }}
        >
          {tituloPendientes}
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
            <IconoVacio className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              {textoVacio}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendientes.slice(0, 5).map((empresa) => {
              const estadoConfig = ESTADO_EMPRESA_CONFIG[empresa.estado];
              return (
                <Link
                  key={empresa.id}
                  href={`${basePath}/${empresa.id}`}
                  className="flex items-start gap-4 rounded-xl px-5 py-4 transition-[border-color]"
                  style={{
                    backgroundColor: "var(--surface-profile)",
                    boxShadow: "var(--shadow-card)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(154,98,250,0.25)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)")}
                >
                  <EmpresaLogo nombre={empresa.nombre} logoUrl={empresa.logoUrl} size={36} radio="lg" className="mt-0.5" />
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
