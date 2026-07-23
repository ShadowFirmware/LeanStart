"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { modoDemo } from "@leanstart/commons";
import { useEmpresasStore } from "@leanstart/empresas-front";
import {
  useCriteriosStore, useViabilidadStore, useEvaluacionesStore,
  calcularReporte, REPORTE_GIRO_LABELS,
} from "@leanstart/administrador-front";
import { ResultadoEvaluacion } from "@leanstart/evaluador-front";

const ESTADO_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  publicado: { label: "Publicado", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  devuelto: { label: "Devuelto", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

/** Vista de solo lectura: el emprendedor ve la misma evaluación que arma el evaluador, sin
 *  poder calificar ni editar nada — solo aparece una vez que la evaluación fue finalizada. */
export function EmprendedorEvaluacionView() {
  const { id } = useParams<{ id: string }>();
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));
  const criterios = useCriteriosStore((s) => s.criterios);
  const cargarCriterios = useCriteriosStore((s) => s.cargarCriterios);
  const niveles = useViabilidadStore((s) => s.niveles);
  const pesoEvaluacion = useViabilidadStore((s) => s.pesoEvaluacion);
  const evaluacion = useEvaluacionesStore((s) => s.evaluaciones[id]);
  const cargarEvaluacion = useEvaluacionesStore((s) => s.cargarEvaluacion);

  useEffect(() => {
    if (modoDemo()) return;
    cargarCriterios().catch(() => {});
    cargarEvaluacion(id).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!empresa) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <Link href="/emprendedor/empresas" className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: "var(--text-dim)" }}>
          <ArrowLeft className="w-4 h-4" /> Mis Empresas
        </Link>
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>Esta empresa no existe o fue eliminada.</p>
      </div>
    );
  }

  const estadoCfg = ESTADO_LABEL[empresa.estado];
  const calculo = calcularReporte(empresa, evaluacion, criterios, niveles, pesoEvaluacion);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <Link
        href={`/emprendedor/empresas/${id}`}
        className="inline-flex items-center gap-2 text-sm w-fit transition-colors"
        style={{ color: "var(--text-dim)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-strong)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-dim)")}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="truncate max-w-[180px] md:max-w-none">{empresa.nombre}</span>
      </Link>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold break-words" style={{ color: "var(--text-strong)" }}>Evaluación del Proyecto</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            {empresa.nombre} · {REPORTE_GIRO_LABELS[empresa.giro]}
          </p>
        </div>
        {estadoCfg && (
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
            style={{ color: estadoCfg.color, backgroundColor: estadoCfg.bg }}
          >
            {estadoCfg.label}
          </span>
        )}
      </div>

      <ResultadoEvaluacion calculo={calculo} niveles={niveles} comentarioGeneral={evaluacion?.comentarioEvaluador ?? ""} />
    </div>
  );
}
