"use client";

import { useParams } from "next/navigation";
import { EmpresaDetailView } from "@leanstart/empresas-front";
import { EvaluacionCTA } from "../components/evaluacion-cta";

export function EvaluadorEmpresaDetailView() {
  const { id } = useParams<{ id: string }>();

  return (
    <EmpresaDetailView
      basePath="/evaluador/empresas"
      readOnly
      backLabel="Empresas"
      contenidoAdicional={<EvaluacionCTA empresaId={id} />}
    />
  );
}
