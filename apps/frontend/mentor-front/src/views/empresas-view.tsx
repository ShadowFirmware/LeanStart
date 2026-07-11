"use client";

import { EmpresasListView } from "@leanstart/empresas-front";
import { useCurrentUser, DEMO_MODE } from "@leanstart/commons";

/** Estados en los que un proyecto está activamente en manos del mentor. */
const ESTADOS_MENTORIA = ["en_mentoria", "observaciones_pendientes", "observaciones_atendidas"] as const;

export function MentorEmpresasView() {
  const currentUser = useCurrentUser();
  // Con backend real, cada mentor ve sólo las empresas asignadas a SU id.
  // En modo demo las asignaciones usan ids de usuarios sembrados (no "demo-mentor"),
  // por lo que se relaja el filtro a "todas las asignadas" para que el demo muestre datos.
  const scopeAsignadoId = DEMO_MODE ? undefined : currentUser?.id;

  return (
    <EmpresasListView
      basePath="/mentor/empresas"
      readOnly
      title="Empresas"
      soloAsignados="mentor"
      scopeAsignadoId={scopeAsignadoId}
      estadosPermitidos={[...ESTADOS_MENTORIA]}
      mostrarFiltroGiro
    />
  );
}
