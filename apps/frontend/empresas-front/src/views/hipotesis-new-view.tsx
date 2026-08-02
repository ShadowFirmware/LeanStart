"use client";

import { useParams } from "next/navigation";
import { useEmpresasStore } from "../store/empresas";
import { HipotesisWizard } from "../components/hipotesis-wizard";

/* ─── Página: crear una hipótesis nueva (siempre arranca en el paso 1) ─── */
export function HipotesisNewView() {
  const { id } = useParams<{ id: string }>();
  const empresa = useEmpresasStore((s) => s.empresas.find((e) => e.id === id));

  if (!empresa) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <p className="text-sm" style={{ color: "var(--text-dim)" }}>Empresa no encontrada.</p>
      </div>
    );
  }

  return <HipotesisWizard empresaId={id} empresaNombre={empresa.nombre} />;
}
