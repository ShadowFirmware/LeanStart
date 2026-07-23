"use client";

import Link from "next/link";
import { ClipboardList, ChevronRight } from "lucide-react";
import { useEmpresasStore } from "@leanstart/empresas-front";

interface EvaluacionCTAProps {
  empresaId: string;
}

/**
 * Tarjeta de entrada a la evaluación ya finalizada, mostrada al fondo del detalle de la
 * empresa del emprendedor — solo cuando el evaluador ya la calificó (devuelto/publicado).
 * A diferencia de la del evaluador, esta nunca lleva a un formulario editable. El score
 * ya vive congelado en la propia empresa (empresa.scoreFinal), no hace falta recalcularlo
 * aquí — evita cargar criterios/evaluación solo para esta tarjeta.
 */
export function EvaluacionCTA({ empresaId }: EvaluacionCTAProps) {
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === empresaId));

  if (!empresa || (empresa.estado !== "devuelto" && empresa.estado !== "publicado")) return null;

  return (
    <Link
      href={`/emprendedor/empresas/${empresaId}/evaluacion`}
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
          Calificación final registrada: {empresa.scoreFinal}%
        </p>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-medium shrink-0" style={{ color: "var(--brand)" }}>
        Ver evaluación <ChevronRight className="w-3.5 h-3.5" />
      </span>
    </Link>
  );
}
