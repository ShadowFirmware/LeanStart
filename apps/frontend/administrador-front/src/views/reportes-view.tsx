"use client";

import { useMemo, useState } from "react";
import { BarChart3, FileText, LayoutTemplate, Sparkles, MessageSquare, ChevronRight, RefreshCw } from "lucide-react";
import { Textarea } from "@leanstart/commons";
import { useEmpresasStore, type Empresa } from "@leanstart/empresas-front";
import type { EstadoEmpresa } from "@leanstart/commons";
import { useCriteriosStore } from "../store/criterios";
import { useViabilidadStore } from "../store/viabilidad";
import { useEvaluacionesStore } from "../store/evaluaciones";
import { calcularReporte, GIRO_LABELS } from "../lib/reporte";
import { ReporteDocumento } from "../components/reporte-documento";

const cardStyle = { backgroundColor: "#131219", border: "1px solid rgba(255,255,255,0.06)" };
const MAX_COMENTARIO = 600;

const ESTADO_LABEL: Record<EstadoEmpresa, { label: string; color: string }> = {
  borrador: { label: "Borrador", color: "#9A62FA" },
  pendiente_mentoria: { label: "Pendiente de mentoría", color: "#F59E0B" },
  en_mentoria: { label: "En mentoría", color: "#3B82F6" },
  observaciones_pendientes: { label: "Observaciones pendientes", color: "#EF4444" },
  observaciones_atendidas: { label: "Obs. atendidas", color: "#10B981" },
  pendiente_evaluacion: { label: "Pendiente de evaluación", color: "#F59E0B" },
  en_evaluacion: { label: "En evaluación", color: "#3B82F6" },
  evaluado: { label: "Evaluado", color: "#10B981" },
  publicado: { label: "Publicado", color: "#10B981" },
  devuelto: { label: "Devuelto", color: "#EF4444" },
};

/** Logo de la empresa (o inicial) con tamaño configurable. */
function EmpresaLogo({ empresa, size = 44 }: { empresa: Empresa; size?: number }) {
  if (empresa.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={empresa.logoUrl}
        alt={empresa.nombre}
        className="rounded-xl object-cover shrink-0"
        style={{ width: size, height: size, border: "1px solid rgba(255,255,255,0.08)" }}
      />
    );
  }
  return (
    <div
      className="rounded-xl flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: "rgba(154,98,250,0.12)", color: "#9A62FA" }}
    >
      {empresa.nombre.charAt(0).toUpperCase()}
    </div>
  );
}

export function ReportesView() {
  const empresas = useEmpresasStore((s) => s.empresas);
  const criterios = useCriteriosStore((s) => s.criterios);
  const niveles = useViabilidadStore((s) => s.niveles);
  const pesoEvaluacion = useViabilidadStore((s) => s.pesoEvaluacion);

  const evaluaciones = useEvaluacionesStore((s) => s.evaluaciones);
  const setPuntaje = useEvaluacionesStore((s) => s.setPuntaje);
  const setComentario = useEvaluacionesStore((s) => s.setComentario);

  const empresasOrdenadas = useMemo(
    () => [...empresas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })),
    [empresas]
  );

  const [empresaId, setEmpresaId] = useState<string>("");
  const [reporteActivo, setReporteActivo] = useState<"boleta" | "canvas" | null>(null);

  const empresa = empresas.find((e) => e.id === empresaId);
  const evaluacion = empresaId ? evaluaciones[empresaId] : undefined;
  const comentario = evaluacion?.comentarioEvaluador ?? "";

  const calculo = useMemo(
    () => (empresa ? calcularReporte(empresa, evaluacion, criterios, niveles, pesoEvaluacion) : null),
    [empresa, evaluacion, criterios, niveles, pesoEvaluacion]
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(154,98,250,0.12)", border: "1px solid rgba(154,98,250,0.2)" }}>
          <BarChart3 className="w-5 h-5" style={{ color: "#9A62FA" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#F2F0F7" }}>Reportes</h1>
          <p className="text-sm mt-0.5" style={{ color: "#7E7C86" }}>
            Evalúa una empresa y genera su boleta de evaluación o el reporte de Lean Canvas.
          </p>
        </div>
      </div>

      {!empresa || !calculo ? (
        /* Selección de empresa como tarjetas */
        empresasOrdenadas.length === 0 ? (
          <div className="rounded-2xl p-10 flex flex-col items-center text-center" style={cardStyle}>
            <Sparkles className="w-9 h-9 mb-3" style={{ color: "#4A4850" }} />
            <p className="text-sm font-medium mb-1" style={{ color: "#F2F0F7" }}>No hay empresas registradas</p>
            <p className="text-sm" style={{ color: "#7E7C86" }}>Cuando existan empresas, aparecerán aquí para evaluarlas.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm" style={{ color: "#7E7C86" }}>Elige una empresa para capturar su evaluación y generar reportes.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {empresasOrdenadas.map((e) => {
                const est = ESTADO_LABEL[e.estado];
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEmpresaId(e.id)}
                    className="rounded-2xl p-4 flex items-center gap-3 text-left transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9A62FA]"
                    style={cardStyle}
                    onMouseEnter={(ev) => (ev.currentTarget.style.borderColor = "rgba(154,98,250,0.35)")}
                    onMouseLeave={(ev) => (ev.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
                  >
                    <EmpresaLogo empresa={e} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: "#F2F0F7" }}>{e.nombre}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#7E7C86" }}>{GIRO_LABELS[e.giro]}</p>
                      <span
                        className="inline-flex items-center gap-1.5 text-[10px] font-medium mt-1.5 px-2 py-0.5 rounded-full"
                        style={{ color: est.color, backgroundColor: `${est.color}1F` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: est.color }} />
                        {est.label}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#4A4850" }} />
                  </button>
                );
              })}
            </div>
          </div>
        )
      ) : (
        <>
        {/* Empresa seleccionada */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={cardStyle}>
          <EmpresaLogo empresa={empresa} size={44} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#F2F0F7" }}>{empresa.nombre}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "#7E7C86" }}>{GIRO_LABELS[empresa.giro]} · {ESTADO_LABEL[empresa.estado].label}</p>
          </div>
          <button
            type="button"
            onClick={() => setEmpresaId("")}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 h-8 rounded-lg shrink-0 transition-colors"
            style={{ color: "#C9A8FE", backgroundColor: "rgba(154,98,250,0.12)", border: "1px solid rgba(154,98,250,0.25)" }}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Cambiar empresa
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Panel de evaluación */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Criterios */}
            <div className="rounded-2xl p-4 md:p-6 flex flex-col gap-4" style={cardStyle}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>Criterios de evaluación</span>
                <span className="text-xs" style={{ color: "#7E7C86" }}>Calificación 0–100</span>
              </div>
              {criterios.length === 0 ? (
                <p className="text-sm" style={{ color: "#7E7C86" }}>No hay criterios configurados. Créalos en “Criterios de evaluación”.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {criterios.map((c) => {
                    const valor = Math.round(evaluacion?.criterios?.[c.id] ?? 0);
                    return (
                      <div key={c.id} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "#F2F0F7" }}>{c.nombre}</p>
                            <p className="text-[11px]" style={{ color: "#7E7C86" }}>Peso {c.peso}%</p>
                          </div>
                          <span className="text-sm font-bold shrink-0 w-12 text-right" style={{ color: "#C9A8FE" }}>{valor}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={valor}
                          onChange={(e) => setPuntaje(empresaId, c.id, Number(e.target.value))}
                          className="w-full cursor-pointer"
                          style={{ accentColor: "#9A62FA" }}
                          aria-label={`Calificación de ${c.nombre}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Comentario del evaluador */}
            <div className="rounded-2xl p-4 md:p-6 flex flex-col gap-2.5" style={cardStyle}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" style={{ color: "#9A62FA" }} />
                <span className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>Comentarios del evaluador</span>
              </div>
              <p className="text-[11px]" style={{ color: "#7E7C86" }}>Se incluyen en el reporte del Lean Canvas.</p>
              <Textarea
                value={comentario}
                maxLength={MAX_COMENTARIO}
                onChange={(e) => setComentario(empresaId, e.target.value)}
                placeholder="Observaciones generales sobre el proyecto, fortalezas, riesgos y recomendaciones."
                className="min-h-28 resize-none text-sm focus-visible:ring-0"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0F7" }}
              />
              <span className="text-xs text-right" style={{ color: "#4A4850" }}>{comentario.length} / {MAX_COMENTARIO}</span>
            </div>
          </div>

          {/* Resumen + generar */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-6">
            <div className="rounded-2xl p-5 flex flex-col gap-4" style={cardStyle}>
              <span className="text-sm font-semibold" style={{ color: "#F2F0F7" }}>Resultado</span>

              <ScoreRow label="Evaluación" value={calculo.scoreEvaluacion} />
              <ScoreRow label="Hipótesis" value={calculo.scoreHipotesis} sub={`${calculo.hipotesis.validadas}/${calculo.hipotesis.total} validadas`} />

              <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(154,98,250,0.08)", border: "1px solid rgba(154,98,250,0.22)" }}>
                <p className="text-xs uppercase tracking-wider font-medium" style={{ color: "#9A62FA" }}>Calificación final</p>
                <p className="text-3xl font-bold mt-1" style={{ color: "#F2F0F7" }}>{calculo.scoreFinal}%</p>
                <p className="text-[11px] mt-1" style={{ color: "#7E7C86" }}>{calculo.pesoEvaluacion}% evaluación · {100 - calculo.pesoEvaluacion}% hipótesis</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#7E7C86" }}>Viabilidad</span>
                {calculo.nivel ? (
                  <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: calculo.nivel.color }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: calculo.nivel.color }} />
                    {calculo.nivel.nombre}
                  </span>
                ) : <span className="text-sm" style={{ color: "#7E7C86" }}>—</span>}
              </div>
            </div>

            {/* Botones de reporte */}
            <div className="rounded-2xl p-5 flex flex-col gap-2.5" style={cardStyle}>
              <span className="text-sm font-semibold mb-0.5" style={{ color: "#F2F0F7" }}>Generar reporte</span>
              <button
                type="button"
                onClick={() => setReporteActivo("boleta")}
                className="inline-flex items-center gap-2.5 w-full px-4 h-11 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 border-0"
                style={{ background: "linear-gradient(135deg, #9A62FA 0%, #AE6CFD 100%)", color: "#FBFBFC" }}
              >
                <FileText className="w-4 h-4" />
                <span className="flex-1 text-left">Boleta de evaluación</span>
              </button>
              <button
                type="button"
                onClick={() => setReporteActivo("canvas")}
                className="inline-flex items-center gap-2.5 w-full px-4 h-11 rounded-xl text-sm font-medium transition-colors"
                style={{ color: "#F2F0F7", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
              >
                <LayoutTemplate className="w-4 h-4" style={{ color: "#9A62FA" }} />
                <span className="flex-1 text-left">Reporte Lean Canvas</span>
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Documento imprimible */}
      {reporteActivo && empresa && calculo && (
        <ReporteDocumento
          tipo={reporteActivo}
          empresa={empresa}
          calculo={calculo}
          comentarioEvaluador={comentario}
          onClose={() => setReporteActivo(null)}
        />
      )}
    </div>
  );
}

function ScoreRow({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "#C4C2CC" }}>{label}</span>
        <span className="text-sm font-bold" style={{ color: "#F2F0F7" }}>{value}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: "linear-gradient(90deg,#9A62FA,#AE6CFD)" }} />
      </div>
      {sub && <span className="text-[11px]" style={{ color: "#7E7C86" }}>{sub}</span>}
    </div>
  );
}
