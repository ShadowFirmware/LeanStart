"use client";

import Link from "next/link";
import { ClipboardList, ChevronRight } from "lucide-react";
import { useEmpresasStore } from "@leanstart/empresas-front";
import { useCriteriosStore, useViabilidadStore, useEvaluacionesStore, calcularReporte } from "@leanstart/administrador-front";

interface EvaluacionCTAProps {
  empresaId: string;
}

/** Tarjeta de entrada a la página de evaluación, mostrada en el detalle de la empresa. */
export function EvaluacionCTA({ empresaId }: EvaluacionCTAProps) {
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === empresaId));
  const criterios = useCriteriosStore((s) => s.criterios);
  const niveles = useViabilidadStore((s) => s.niveles);
  const pesoEvaluacion = useViabilidadStore((s) => s.pesoEvaluacion);
  const evaluacion = useEvaluacionesStore((s) => s.evaluaciones[empresaId]);

  if (!empresa) return null;

  const evaluada = empresa.estado !== "en_evaluacion";
  const calculo = calcularReporte(empresa, evaluacion, criterios, niveles, pesoEvaluacion);

  return (
    <Link
      href={`/evaluador/empresas/${empresaId}/evaluar`}
      className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-[border-color]"
      style={{ backgroundColor: "rgba(154,98,250,0.06)", border: "1px solid var(--brand-tint-strong)" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(154,98,250,0.4)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--brand-tint-strong)")}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: "rgba(154,98,250,0.14)" }}
      >
        <ClipboardList className="w-4.5 h-4.5" style={{ color: "var(--brand)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>Evaluación del Proyecto</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
          {evaluada ? `Calificación final registrada: ${calculo.scoreFinal}%` : "Aún no has evaluado este proyecto."}
        </p>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-medium shrink-0" style={{ color: "var(--brand)" }}>
        {evaluada ? "Ver evaluación" : "Evaluar proyecto"} <ChevronRight className="w-3.5 h-3.5" />
      </span>
    </Link>
  );
}
