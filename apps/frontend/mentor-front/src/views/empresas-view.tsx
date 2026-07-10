"use client";

import { EmpresasListView } from "@leanstart/empresas-front";

/** Estados en los que un proyecto está activamente en manos del mentor. */
const ESTADOS_MENTORIA = ["en_mentoria", "observaciones_pendientes", "observaciones_atendidas"] as const;

export function MentorEmpresasView() {
  return (
    <EmpresasListView
      basePath="/mentor/empresas"
      readOnly
      title="Empresas"
      soloAsignados="mentor"
      estadosPermitidos={[...ESTADOS_MENTORIA]}
      mostrarFiltroGiro
    />
  );
}
