"use client";

import { EmpresasListView } from "@leanstart/empresas-front";

export function EvaluadorEmpresasView() {
  return (
    <EmpresasListView
      basePath="/evaluador/empresas"
      readOnly
      title="Empresas"
      soloAsignados="evaluador"
      estadosPermitidos={["en_evaluacion", "publicado", "devuelto"]}
      mostrarFiltroGiro
    />
  );
}
