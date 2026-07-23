"use client";

import { EmpresasListView } from "@leanstart/empresas-front";
import { useViabilidadStore } from "@leanstart/administrador-front";

export function EvaluadorEmpresasView() {
  const niveles = useViabilidadStore((s) => s.niveles);

  return (
    <EmpresasListView
      basePath="/evaluador/empresas"
      readOnly
      title="Empresas"
      soloAsignados="evaluador"
      estadosPermitidos={["en_evaluacion", "publicado", "devuelto"]}
      mostrarFiltroGiro
      nivelesViabilidad={niveles}
    />
  );
}
