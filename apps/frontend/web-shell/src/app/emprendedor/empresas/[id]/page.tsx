"use client";

import { useParams } from "next/navigation";
import { EmpresaDetailView } from "@leanstart/empresas-front";
import { EvaluacionCTA } from "@/components/emprendedor/evaluacion-cta";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <EmpresaDetailView contenidoAdicional={<EvaluacionCTA empresaId={id} />} />;
}
