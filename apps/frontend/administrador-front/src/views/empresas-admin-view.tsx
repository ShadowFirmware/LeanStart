"use client";

import { EmpresasListView } from "@leanstart/empresas-front";

export function EmpresasAdminView() {
  return (
    <EmpresasListView
      basePath="/administrador/empresas"
      readOnly
      title="Empresas"
      permitirAsignaciones
    />
  );
}
