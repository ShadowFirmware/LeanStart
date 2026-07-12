"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEmpresasStore } from "@leanstart/empresas-front";
import { REPORTE_GIRO_LABELS } from "@leanstart/administrador-front";
import { EvaluacionForm } from "../components/evaluacion-form";

const ESTADO_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  en_evaluacion: { label: "En evaluación", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  evaluado: { label: "Evaluado", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  publicado: { label: "Publicado", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  devuelto: { label: "Devuelto", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

export function EvaluadorEvaluacionView() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));

  // Esta página se sirve tanto desde /evaluador/empresas/[id]/evaluar como desde
  // /evaluador/historial/[id]; el botón "volver" respeta desde dónde se entró.
  const enHistorial = pathname.startsWith("/evaluador/historial");
  const backHref = enHistorial ? "/evaluador/historial" : `/evaluador/empresas/${id}`;
  const backLabel = enHistorial ? "Historial" : empresa?.nombre;

  if (!empresa) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <Link href={enHistorial ? "/evaluador/historial" : "/evaluador/empresas"} className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: "#7E7C86" }}>
          <ArrowLeft className="w-4 h-4" /> {enHistorial ? "Historial" : "Empresas"}
        </Link>
        <p className="text-sm" style={{ color: "#7E7C86" }}>Esta empresa no existe o fue eliminada.</p>
      </div>
    );
  }

  const estadoCfg = ESTADO_LABEL[empresa.estado];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm w-fit transition-colors"
        style={{ color: "#7E7C86" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F2F0F7")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7E7C86")}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="truncate max-w-[180px] md:max-w-none">{backLabel}</span>
      </Link>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold break-words" style={{ color: "#F2F0F7" }}>Evaluación del Proyecto</h1>
          <p className="text-sm mt-1" style={{ color: "#7E7C86" }}>
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

      <EvaluacionForm empresaId={id} />
    </div>
  );
}
