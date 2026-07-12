"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { History, Search, ClipboardCheck, Percent, Award } from "lucide-react";
import { useEmpresasStore, type Empresa } from "@leanstart/empresas-front";
import { useHasHydrated } from "@leanstart/commons";
import type { EstadoEmpresa } from "@leanstart/commons";
import {
  useCriteriosStore, useViabilidadStore, useEvaluacionesStore,
  calcularReporte, REPORTE_GIRO_LABELS,
} from "@leanstart/administrador-front";

const ESTADOS_HISTORIAL: EstadoEmpresa[] = ["evaluado", "publicado", "devuelto"];

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  evaluado: { label: "Evaluado", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  publicado: { label: "Publicado", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  devuelto: { label: "Devuelto", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

/** Logo de la empresa (o inicial). */
function EmpresaLogo({ empresa, size = 40 }: { empresa: Empresa; size?: number }) {
  if (empresa.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={empresa.logoUrl}
        alt={empresa.nombre}
        className="rounded-lg object-cover shrink-0"
        style={{ width: size, height: size, border: "1px solid rgba(255,255,255,0.08)" }}
      />
    );
  }
  return (
    <div
      className="rounded-lg flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: "rgba(154,98,250,0.12)", color: "#9A62FA" }}
    >
      {empresa.nombre.charAt(0).toUpperCase()}
    </div>
  );
}

export function EvaluadorHistorialView() {
  const hydrated = useHasHydrated();
  const empresasRaw = useEmpresasStore((s) => s.empresas);
  const empresas = hydrated ? empresasRaw : [];

  const criterios = useCriteriosStore((s) => s.criterios);
  const niveles = useViabilidadStore((s) => s.niveles);
  const pesoEvaluacion = useViabilidadStore((s) => s.pesoEvaluacion);
  const evaluaciones = useEvaluacionesStore((s) => s.evaluaciones);

  const [busqueda, setBusqueda] = useState("");

  const registros = useMemo(() => {
    return empresas
      .filter((e) => e.evaluadorId && ESTADOS_HISTORIAL.includes(e.estado))
      .map((empresa) => {
        const evaluacion = evaluaciones[empresa.id];
        const calculo = calcularReporte(empresa, evaluacion, criterios, niveles, pesoEvaluacion);
        return { empresa, calculo, fecha: evaluacion?.actualizadoEn ?? empresa.updatedAt };
      });
  }, [empresas, evaluaciones, criterios, niveles, pesoEvaluacion]);

  const registrosFiltrados = registros.filter((r) =>
    r.empresa.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const total = registros.length;
  const promedio = total > 0 ? Math.round(registros.reduce((acc, r) => acc + r.calculo.scoreFinal, 0) / total) : 0;
  const aprobadas = registros.filter((r) => r.empresa.estado !== "devuelto").length;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#F2F0F7" }}>Historial de Evaluaciones</h1>
        <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
          Consulta las evaluaciones que has realizado anteriormente.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Empresas evaluadas", value: `${total}`, icon: ClipboardCheck },
          { label: "Calificación promedio", value: `${promedio}%`, icon: Percent },
          { label: "Aprobadas", value: `${aprobadas}`, icon: Award },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl p-5 flex items-center gap-4"
            style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(154,98,250,0.10)", border: "1px solid rgba(154,98,250,0.15)" }}
            >
              <Icon className="w-5 h-5" style={{ color: "#9A62FA" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#7E7C86" }}>{label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: "#F2F0F7" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      {registros.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#4A4850" }} />
          <input
            type="text"
            placeholder="Buscar por empresa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg text-sm outline-none transition-colors"
            style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.07)", color: "#F2F0F7" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(154,98,250,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
          />
        </div>
      )}

      {/* Lista de evaluaciones */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#7E7C86" }}>
          Evaluaciones realizadas
        </p>

        {registrosFiltrados.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <History className="w-8 h-8 mx-auto mb-3" style={{ color: "#7E7C86" }} />
            <p className="text-sm" style={{ color: "#7E7C86" }}>
              {registros.length === 0
                ? "Aún no has finalizado ninguna evaluación. Cuando finalices una, aparecerá aquí."
                : "Sin resultados para tu búsqueda."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {registrosFiltrados.map(({ empresa, calculo, fecha }) => {
              const estadoCfg = ESTADO_CONFIG[empresa.estado] ?? ESTADO_CONFIG.evaluado;
              return (
                <Link
                  key={empresa.id}
                  href={`/evaluador/historial/${empresa.id}`}
                  className="flex flex-col gap-3 rounded-xl px-5 py-4 transition-[border-color]"
                  style={{ backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(154,98,250,0.25)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)")}
                >
                  <div className="flex items-start gap-3">
                    <EmpresaLogo empresa={empresa} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#F2F0F7" }}>{empresa.nombre}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#7E7C86" }}>
                            {REPORTE_GIRO_LABELS[empresa.giro]} · {fecha}
                          </p>
                        </div>
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                          style={{ color: estadoCfg.color, backgroundColor: estadoCfg.bg }}
                        >
                          {estadoCfg.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold" style={{ color: "#F2F0F7" }}>{calculo.scoreFinal}%</span>
                      <span className="text-xs" style={{ color: "#7E7C86" }}>calificación final</span>
                    </div>
                    {calculo.nivel && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: calculo.nivel.color }} />
                        <span className="text-xs font-medium" style={{ color: calculo.nivel.color }}>
                          Viabilidad {calculo.nivel.nombre}
                        </span>
                      </div>
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
