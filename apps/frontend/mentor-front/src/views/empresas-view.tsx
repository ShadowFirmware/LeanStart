"use client";

import { EmpresasListView } from "@leanstart/empresas-front";

export function MentorEmpresasView() {
  return (
    <EmpresasListView
      basePath="/mentor/empresas"
      readOnly
      title="Empresas"
    />
  );
}
