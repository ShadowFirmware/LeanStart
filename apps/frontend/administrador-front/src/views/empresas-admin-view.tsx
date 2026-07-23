"use client";

import { EmpresasListView } from "@leanstart/empresas-front";
import { useViabilidadStore } from "../store/viabilidad";

export function EmpresasAdminView() {
  const niveles = useViabilidadStore((s) => s.niveles);

  return (
    <EmpresasListView
      basePath="/administrador/empresas"
      readOnly
      title="Empresas"
      permitirAsignaciones
      nivelesViabilidad={niveles}
    />
  );
}
